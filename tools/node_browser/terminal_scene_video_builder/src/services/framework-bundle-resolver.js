import path from 'node:path';

export class FrameworkBundleResolver {
  static resolve({ sceneHtmlPath, configuredPath, envPath = null }) {
    const explicitPath = configuredPath ?? envPath ?? null;
    if (explicitPath) {
      return path.resolve(explicitPath);
    }

    return path.resolve(
      path.dirname(sceneHtmlPath),
      '../../../../../InterDeadCore/framework/dist/browser/interdead-framework.global.js',
    );
  }
}
