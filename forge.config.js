const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel', // Windows Installer
      config: {
        "arch": "ia32"
      },
    },
    {
      name: '@electron-forge/maker-zip', // MacOS/Windows ZIP
      platforms: ['darwin'],
      
    },
    {
      name: '@electron-forge/maker-deb', // Linux DEB
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm', // Linux RPM
      config: {},
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'UDZO', // Changed from ULFO
        background: './src/assets/dmg-background-new.png', // Ensure this file exists
        icon: './src/assets/app-icon.ico', // Ensure this file exists
        overwrite: true,
        window: {
          width: 540,
          height: 380, 
        },
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
