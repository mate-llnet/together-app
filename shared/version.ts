export const APP_VERSION = "1.6.0-beta";
export const APP_NAME = "AppreciateMate";
export const BUILD_DATE = new Date().toISOString().split('T')[0];

export function getVersionInfo() {
  return {
    version: APP_VERSION,
    name: APP_NAME,
    buildDate: BUILD_DATE,
    fullVersion: `${APP_NAME} v${APP_VERSION}`,
    displayVersion: `v${APP_VERSION}`
  };
}