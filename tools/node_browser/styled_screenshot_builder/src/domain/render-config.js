class ResolutionPresetRegistry {
  constructor() {
    this.presets = {
      '4k': { width: 3840, height: 2160 },
      '2k': { width: 2560, height: 1440 },
      '1080p': { width: 1920, height: 1080 },
    };
  }

  resolve(presetName) {
    const normalized = String(presetName || '4k').trim().toLowerCase();
    const preset = this.presets[normalized];
    if (!preset) {
      throw new Error(`Unknown resolution preset: ${presetName}. Available: ${Object.keys(this.presets).join(', ')}`);
    }
    return preset;
  }
}

class ConfigValidationError extends Error {
  constructor(messages) {
    super(`Config validation failed:\n- ${messages.join('\n- ')}`);
    this.messages = messages;
  }
}

class LangNormalizer {
  constructor() {
    this.supported = new Set(['en', 'ru', 'uk']);
  }

  normalize(value) {
    const raw = String(value ?? 'en').trim().toLowerCase().replaceAll('_', '-');
    const [base] = raw.split('-');
    if (!this.supported.has(base)) {
      throw new Error(`Unsupported page.lang: ${value}. Allowed: en, ru, uk.`);
    }
    return base;
  }
}

class TextItemValidator {
  constructor() {
    this.allowedAlign = new Set(['left', 'center', 'right']);
    this.allowedAnchor = new Set(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right']);
  }

  validate(item, index) {
    const errors = [];
    const path = `textItems[${index}]`;

    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return [`${path} must be an object.`];
    }

    if (typeof item.text !== 'string' || item.text.trim() === '') {
      errors.push(`${path}.text must be a non-empty string.`);
    }

    if (!this.hasCoordinate(item, 'x')) {
      errors.push(`${path} must include x or xPct.`);
    }
    if (!this.hasCoordinate(item, 'y')) {
      errors.push(`${path} must include y or yPct.`);
    }

    this.validateNumeric(item, 'fontSize', path, errors);
    this.validateNumeric(item, 'fontWeight', path, errors);
    this.validateNumeric(item, 'maxWidth', path, errors);
    this.validateNumeric(item, 'lineHeight', path, errors);
    this.validateNumeric(item, 'letterSpacing', path, errors);

    if (item.align !== undefined && !this.allowedAlign.has(item.align)) {
      errors.push(`${path}.align must be one of: left, center, right.`);
    }

    if (item.anchor !== undefined && !this.allowedAnchor.has(item.anchor)) {
      errors.push(`${path}.anchor must be one of: ${Array.from(this.allowedAnchor).join(', ')}.`);
    }

    if (item.color !== undefined && !RenderConfigValidators.isColorLike(item.color)) {
      errors.push(`${path}.color must look like a valid CSS color.`);
    }

    return errors;
  }

  hasCoordinate(item, axis) {
    const pxKey = axis;
    const pctKey = `${axis}Pct`;
    return Number.isFinite(item[pxKey]) || Number.isFinite(item[pctKey]);
  }

  validateNumeric(item, key, path, errors) {
    if (item[key] !== undefined && !Number.isFinite(item[key])) {
      errors.push(`${path}.${key} must be a finite number when provided.`);
    }
  }
}

class RenderConfigValidators {
  static isColorLike(value) {
    if (typeof value !== 'string') {
      return false;
    }
    const normalized = value.trim();
    return (
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)
      || /^(rgb|rgba|hsl|hsla)\(.+\)$/.test(normalized)
      || /^[a-zA-Z]+$/.test(normalized)
    );
  }
}

class RenderConfig {
  constructor(rawConfig, registry = new ResolutionPresetRegistry(), langNormalizer = new LangNormalizer(), textItemValidator = new TextItemValidator()) {
    this.rawConfig = rawConfig;
    this.registry = registry;
    this.langNormalizer = langNormalizer;
    this.textItemValidator = textItemValidator;
  }

  toRuntime() {
    const resolutionPreset = this.rawConfig.video?.preset ?? '4k';
    const presetSize = this.registry.resolve(resolutionPreset);
    const width = this.rawConfig.video?.width ?? presetSize.width;
    const height = this.rawConfig.video?.height ?? presetSize.height;
    const lang = this.langNormalizer.normalize(this.rawConfig.page?.lang ?? 'en');

    const validationErrors = [];

    if (!Number.isInteger(width) || width <= 0) {
      validationErrors.push('video.width must be a positive integer.');
    }
    if (!Number.isInteger(height) || height <= 0) {
      validationErrors.push('video.height must be a positive integer.');
    }

    const textItems = this.rawConfig.textItems ?? [];
    if (!Array.isArray(textItems)) {
      validationErrors.push('textItems must be an array.');
    }

    if (Array.isArray(textItems)) {
      textItems.forEach((item, index) => {
        validationErrors.push(...this.textItemValidator.validate(item, index));
      });
    }

    const outputFile = this.rawConfig.output?.file ?? 'out/screenshot.png';
    if (typeof outputFile !== 'string' || outputFile.trim() === '') {
      validationErrors.push('output.file must be a non-empty string.');
    }

    const backgroundColor = this.rawConfig.background?.color ?? '#001501';
    if (!RenderConfigValidators.isColorLike(backgroundColor)) {
      validationErrors.push('background.color must look like a valid CSS color.');
    }

    const scanlinesOpacity = this.rawConfig.background?.scanlinesOpacity ?? 0.18;
    const vignetteOpacity = this.rawConfig.background?.vignetteOpacity ?? 0.6;

    if (!Number.isFinite(scanlinesOpacity) || scanlinesOpacity < 0 || scanlinesOpacity > 1) {
      validationErrors.push('background.scanlinesOpacity must be within [0..1].');
    }

    if (!Number.isFinite(vignetteOpacity) || vignetteOpacity < 0 || vignetteOpacity > 1) {
      validationErrors.push('background.vignetteOpacity must be within [0..1].');
    }

    if (validationErrors.length > 0) {
      throw new ConfigValidationError(validationErrors);
    }

    return {
      width,
      height,
      outputFile,
      lang,
      textItems,
      screenshot: {
        type: this.rawConfig.screenshot?.type ?? 'png',
        omitBackground: Boolean(this.rawConfig.screenshot?.omitBackground),
      },
      background: {
        color: backgroundColor,
        image: this.rawConfig.background?.image ?? null,
        enableScanlines: this.rawConfig.background?.enableScanlines !== false,
        scanlinesOpacity,
        vignetteOpacity,
      },
    };
  }
}

module.exports = {
  ConfigValidationError,
  RenderConfig,
  ResolutionPresetRegistry,
};
