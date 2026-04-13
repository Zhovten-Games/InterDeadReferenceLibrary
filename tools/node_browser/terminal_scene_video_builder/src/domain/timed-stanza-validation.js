export function collectTimedStanzaValidationErrors(textOverlay, revealMode) {
  const errors = [];

  if (revealMode !== 'timed_stanzas') {
    return errors;
  }

  if (!Array.isArray(textOverlay.timedStanzas)) {
    errors.push('textOverlay.timedStanzas must be an array when reveal.mode is timed_stanzas.');
    return errors;
  }

  if (textOverlay.timedStanzas.length === 0) {
    errors.push('textOverlay.timedStanzas must not be empty when reveal.mode is timed_stanzas.');
    return errors;
  }

  let previousStart = Number.NEGATIVE_INFINITY;
  let previousEnd = Number.NEGATIVE_INFINITY;

  textOverlay.timedStanzas.forEach((stanza, index) => {
    if (!stanza || typeof stanza !== 'object' || Array.isArray(stanza)) {
      errors.push(`textOverlay.timedStanzas[${index}] must be an object.`);
      return;
    }

    if (!Number.isFinite(stanza.start)) {
      errors.push(`textOverlay.timedStanzas[${index}].start must be a number.`);
    }

    if (!Number.isFinite(stanza.end)) {
      errors.push(`textOverlay.timedStanzas[${index}].end must be a number.`);
    }

    if (Number.isFinite(stanza.start) && Number.isFinite(stanza.end) && stanza.end <= stanza.start) {
      errors.push(`textOverlay.timedStanzas[${index}] must have end > start.`);
    }

    if (typeof stanza.text !== 'string' || stanza.text.trim().length === 0) {
      errors.push(`textOverlay.timedStanzas[${index}].text must be a non-empty string.`);
    }

    if (Number.isFinite(stanza.start)) {
      if (stanza.start < previousStart) {
        errors.push('textOverlay.timedStanzas must be sorted by start (ascending).');
      }
      if (stanza.start < previousEnd) {
        errors.push('textOverlay.timedStanzas must not overlap.');
      }
      previousStart = stanza.start;
    }

    if (Number.isFinite(stanza.end)) {
      previousEnd = stanza.end;
    }
  });

  return errors;
}

export function assertTimedStanzaConfigValid(textOverlay, revealMode) {
  const errors = collectTimedStanzaValidationErrors(textOverlay, revealMode);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }
}
