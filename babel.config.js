const presets = [
  [
    "@babel/env",
    {
      targets: {
        edge: "17",
        firefox: "60",
        chrome: "67",  //67, using 7 for testing
        safari: "11.1",
      },
      // useBuiltIns: "usage", // Apply polyfills based on usage.
      // corejs: 3,
    },
  ],
  [
    "@babel/preset-react",
    {
      development: false, // Does stupid stuff that isn't useful
    },
  ],
];

const plugins = [
  "react-hot-loader/babel",
];

module.exports = { presets, plugins };
