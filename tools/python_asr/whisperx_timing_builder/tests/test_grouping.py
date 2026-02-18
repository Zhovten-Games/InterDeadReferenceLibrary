import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from whisperx_timing_builder import BlockBuilder, CueExporter


class GroupingTests(unittest.TestCase):
    @staticmethod
    def load_fixture_segments():
        fixture = ROOT / "session" / "out" / "aligned.sample.json"
        data = json.loads(fixture.read_text(encoding="utf-8"))
        return data["segments"]

    def test_blocks_split_by_gap_and_merge_short_tail(self):
        segments = self.load_fixture_segments()
        builder = BlockBuilder(
            gap_threshold=1.2,
            max_block_duration=25.0,
            max_block_chars=240,
            min_block_duration=2.0,
        )

        blocks = builder.build(segments)

        self.assertEqual(3, len(blocks))
        self.assertEqual(0.0, blocks[0]["start"])
        self.assertEqual(4.1, blocks[0]["end"])
        self.assertEqual(5.8, blocks[1]["start"])
        self.assertEqual(9.6, blocks[1]["end"])
        self.assertEqual(12.0, blocks[2]["start"])
        self.assertEqual(17.0, blocks[2]["end"])

    def test_blocks_split_by_char_limit(self):
        segments = [
            {"start": 0.0, "end": 1.0, "text": "a" * 30},
            {"start": 1.1, "end": 2.1, "text": "b" * 30},
        ]
        builder = BlockBuilder(
            gap_threshold=10.0,
            max_block_duration=25.0,
            max_block_chars=40,
            min_block_duration=0.1,
        )

        blocks = builder.build(segments)

        self.assertEqual(2, len(blocks))


class CueExporterTests(unittest.TestCase):
    def test_export_cues_modes(self):
        blocks = [
            {"id": 1, "start": 0.0, "end": 3.0, "text": "alpha", "segments": []},
        ]

        empty = CueExporter(typing_duration=0.5, text_mode="empty").export(blocks)
        ellipsis = CueExporter(typing_duration=0.5, text_mode="ellipsis").export(blocks)
        block_text = CueExporter(typing_duration=0.5, text_mode="block_text").export(blocks)

        self.assertEqual("", empty[0]["text"])
        self.assertEqual("…", ellipsis[0]["text"])
        self.assertEqual("alpha", block_text[0]["text"])
        self.assertEqual(0.5, block_text[0]["typingDuration"])


if __name__ == "__main__":
    unittest.main()
