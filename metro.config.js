// Metro configuration.
//
// Metro only bundles file types it knows about, and 3D formats aren't in the
// default asset list — without this, `require('./mia.glb')` fails to resolve
// and the model silently never loads. `bin` and `gltf` are included too so a
// non-embedded .gltf (which references external binary and texture files) also
// works if one is ever added.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;
