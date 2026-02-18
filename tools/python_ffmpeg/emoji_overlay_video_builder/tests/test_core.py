import json
import tempfile
import unittest
from pathlib import Path

from emoji_overlay_video_builder import (
    AppConfig,
    CommandPrinter,
    ConfigLoader,
    CueConfig,
    EmojiTokenizer,
    FfmpegCommandFactory,
    InputsConfig,
    LayoutConfig,
    LayoutService,
    OutputConfig,
    RenderConfig,
    SafeAreaConfig,
    ValidationService,
    VideoConfig,
)


class DummyResolver:
    def __init__(self, root: Path):
        self.root = root

    def resolve(self, emoji: str) -> Path:
        return self.root / f"{ord(emoji[0]):x}.png"


class MissingResolver:
    def resolve(self, emoji: str) -> Path:
        raise FileNotFoundError(f"Emoji asset not found for '{emoji}'")


class EmojiTokenizerTests(unittest.TestCase):
    def test_keeps_zwj_cluster(self):
        clusters = EmojiTokenizer.split_clusters("👩‍💻✨")
        self.assertEqual(clusters[0], "👩‍💻")

    def test_keeps_skin_tone(self):
        clusters = EmojiTokenizer.split_clusters("👍🏽")
        self.assertEqual(clusters, ["👍🏽"])

    def test_keeps_bmp_emojis(self):
        clusters = EmojiTokenizer.split_clusters("✨❤️☠️")
        self.assertEqual(clusters, ["✨", "❤️", "☠️"])

    def test_keeps_keycap_sequence(self):
        clusters = EmojiTokenizer.split_clusters("1️⃣")
        self.assertEqual(clusters, ["1️⃣"])


class LayoutTests(unittest.TestCase):
    def test_start_x_from_safe_area(self):
        safe = SafeAreaConfig(width=1000, offset_x=10, padding_left=20)
        self.assertEqual(LayoutService.start_x(1280, safe), 170)

    def test_typing_shown_count(self):
        self.assertEqual(LayoutService.shown_count(4, now=1.0, start=0.0, typing_duration=2.0), 3)

    def test_default_top_y_uses_top_margin(self):
        layout = LayoutConfig(emoji_size=72, top_margin=60, offset_y=10)
        self.assertEqual(LayoutService.top_y(720, layout), 70)


class ConfigTests(unittest.TestCase):
    def test_loader_sorts_cues(self):
        with tempfile.TemporaryDirectory() as tmp:
            wd = Path(tmp)
            payload = {
                "inputs": {"background": "background.png", "audio": "audio.wav"},
                "cues": [
                    {"text": "😀", "start": 2, "end": 3},
                    {"text": "😀", "start": 1, "end": 1.5},
                ],
            }
            (wd / "config.json").write_text(json.dumps(payload), encoding="utf-8")
            config = ConfigLoader(wd).load()
            self.assertLessEqual(config.cues[0].start, config.cues[1].start)


class IntegrationTests(unittest.TestCase):
    def test_ffmpeg_command_build(self):
        config = AppConfig(
            inputs=InputsConfig("background.png", "audio.wav", "twemoji-72x72", None),
            safe_area=SafeAreaConfig(width=1000),
            video=VideoConfig(),
            render=RenderConfig(),
            layout=LayoutConfig(),
            output=OutputConfig(),
            cues=[CueConfig(text="😀", start=0.0, end=1.0, typing_duration=0.0)],
        )
        cmd = FfmpegCommandFactory().build(Path("/tmp/work"), config, DummyResolver(Path("/tmp/emoji")))
        self.assertIn("ffmpeg", cmd[0])
        self.assertIn("-filter_complex", cmd)
        self.assertEqual(cmd.count("-loop"), 2)

    def test_typing_uses_gte_expression(self):
        config = AppConfig(
            inputs=InputsConfig("background.png", "audio.wav", "twemoji-72x72", None),
            safe_area=SafeAreaConfig(width=1000),
            video=VideoConfig(),
            render=RenderConfig(),
            layout=LayoutConfig(),
            output=OutputConfig(),
            cues=[CueConfig(text="😀😎", start=0.0, end=2.0, typing_duration=1.0)],
        )
        cmd = FfmpegCommandFactory().build(Path("/tmp/work"), config, DummyResolver(Path("/tmp/emoji")))
        filter_graph = cmd[cmd.index("-filter_complex") + 1]
        self.assertIn("gte(", filter_graph)
        self.assertNotIn("lte(", filter_graph)


class FakeFs:
    def __init__(self, existing: set[Path]):
        self.existing = {Path(p) for p in existing}

    def exists(self, path: Path) -> bool:
        return path in self.existing

    def mkdir(self, path: Path) -> None:
        return None


class ValidationTests(unittest.TestCase):
    def test_validate_reports_missing_override_dir(self):
        workdir = Path('/tmp/work')
        assets_root = Path('/tmp/assets')
        config = AppConfig(
            inputs=InputsConfig('background.png', 'audio.wav', 'twemoji-72x72', 'emoji_override'),
            safe_area=SafeAreaConfig(width=1000),
            video=VideoConfig(),
            render=RenderConfig(),
            layout=LayoutConfig(),
            output=OutputConfig(),
            cues=[],
        )
        existing = {workdir / 'background.png', workdir / 'audio.wav', assets_root / 'emoji' / 'twemoji' / '72x72'}
        validator = ValidationService(FakeFs(existing))
        errors = validator.validate(workdir, config, assets_root, 'twemoji-72x72', None)
        self.assertTrue(any('Emoji override dir not found' in e for e in errors))

    def test_validate_reports_missing_emoji_asset(self):
        workdir = Path('/tmp/work')
        assets_root = Path('/tmp/assets')
        config = AppConfig(
            inputs=InputsConfig('background.png', 'audio.wav', 'twemoji-72x72', None),
            safe_area=SafeAreaConfig(width=1000),
            video=VideoConfig(),
            render=RenderConfig(),
            layout=LayoutConfig(),
            output=OutputConfig(),
            cues=[CueConfig(text='😀', start=0.0, end=1.0)],
        )
        existing = {workdir / 'background.png', workdir / 'audio.wav', assets_root / 'emoji' / 'twemoji' / '72x72'}
        validator = ValidationService(FakeFs(existing))
        errors = validator.validate(workdir, config, assets_root, 'twemoji-72x72', None, MissingResolver())
        self.assertTrue(any('missing emoji asset' in e.lower() for e in errors))


class CliPrecedenceTests(unittest.TestCase):
    def test_emoji_pack_arg_default_is_none(self):
        parser = __import__('argparse').ArgumentParser()
        sub = parser.add_subparsers(dest='command', required=True)
        s = sub.add_parser('probe')
        s.add_argument('--workdir', required=True)
        s.add_argument('--emoji-pack', default=None)
        args = parser.parse_args(['probe', '--workdir', '/tmp/w'])
        self.assertIsNone(args.emoji_pack)


class CommandPrinterTests(unittest.TestCase):
    def test_posix_shell_printing(self):
        cmd = ['ffmpeg', '-i', '/tmp/has space/in.mp4']
        rendered = CommandPrinter.to_shell(cmd, os_name='posix')
        self.assertIn("'/tmp/has space/in.mp4'", rendered)

    def test_windows_shell_printing(self):
        cmd = ['ffmpeg', '-i', r'C:\Temp Folder\in.mp4']
        rendered = CommandPrinter.to_shell(cmd, os_name='nt')
        self.assertIn(r'"C:\Temp Folder\in.mp4"', rendered)


if __name__ == "__main__":
    unittest.main()
