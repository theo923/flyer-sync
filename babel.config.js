// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            // any import of `@trpc/server/unstable-core-do-not-import`
            // will instead load this dist folder
            "@trpc/server/unstable-core-do-not-import":
              "./node_modules/@trpc/server/dist/unstable-core-do-not-import",
          },
        },
      ],
    ],
  };
};
