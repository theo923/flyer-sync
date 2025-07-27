// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add .cjs and .mjs so Metro will look at those files too
config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs", "mjs"];

module.exports = config;
