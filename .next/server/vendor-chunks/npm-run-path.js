"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/npm-run-path";
exports.ids = ["vendor-chunks/npm-run-path"];
exports.modules = {

/***/ "(rsc)/./node_modules/npm-run-path/index.js":
/*!********************************************!*\
  !*** ./node_modules/npm-run-path/index.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nconst path = __webpack_require__(/*! path */ \"path\");\nconst pathKey = __webpack_require__(/*! path-key */ \"(rsc)/./node_modules/path-key/index.js\");\n\nconst npmRunPath = options => {\n\toptions = {\n\t\tcwd: process.cwd(),\n\t\tpath: process.env[pathKey()],\n\t\texecPath: process.execPath,\n\t\t...options\n\t};\n\n\tlet previous;\n\tlet cwdPath = path.resolve(options.cwd);\n\tconst result = [];\n\n\twhile (previous !== cwdPath) {\n\t\tresult.push(path.join(cwdPath, 'node_modules/.bin'));\n\t\tprevious = cwdPath;\n\t\tcwdPath = path.resolve(cwdPath, '..');\n\t}\n\n\t// Ensure the running `node` binary is used\n\tconst execPathDir = path.resolve(options.cwd, options.execPath, '..');\n\tresult.push(execPathDir);\n\n\treturn result.concat(options.path).join(path.delimiter);\n};\n\nmodule.exports = npmRunPath;\n// TODO: Remove this for the next major release\nmodule.exports[\"default\"] = npmRunPath;\n\nmodule.exports.env = options => {\n\toptions = {\n\t\tenv: process.env,\n\t\t...options\n\t};\n\n\tconst env = {...options.env};\n\tconst path = pathKey({env});\n\n\toptions.path = env[path];\n\tenv[path] = module.exports(options);\n\n\treturn env;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbnBtLXJ1bi1wYXRoL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFhO0FBQ2IsYUFBYSxtQkFBTyxDQUFDLGtCQUFNO0FBQzNCLGdCQUFnQixtQkFBTyxDQUFDLHdEQUFVOztBQUVsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseUJBQXNCOztBQUV0QixrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsY0FBYztBQUNkLHVCQUF1QixJQUFJOztBQUUzQjtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9kaW5hbW8tYmF0dW1pLXUxNS8uL25vZGVfbW9kdWxlcy9ucG0tcnVuLXBhdGgvaW5kZXguanM/ZTQwYiJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgcGF0aEtleSA9IHJlcXVpcmUoJ3BhdGgta2V5Jyk7XG5cbmNvbnN0IG5wbVJ1blBhdGggPSBvcHRpb25zID0+IHtcblx0b3B0aW9ucyA9IHtcblx0XHRjd2Q6IHByb2Nlc3MuY3dkKCksXG5cdFx0cGF0aDogcHJvY2Vzcy5lbnZbcGF0aEtleSgpXSxcblx0XHRleGVjUGF0aDogcHJvY2Vzcy5leGVjUGF0aCxcblx0XHQuLi5vcHRpb25zXG5cdH07XG5cblx0bGV0IHByZXZpb3VzO1xuXHRsZXQgY3dkUGF0aCA9IHBhdGgucmVzb2x2ZShvcHRpb25zLmN3ZCk7XG5cdGNvbnN0IHJlc3VsdCA9IFtdO1xuXG5cdHdoaWxlIChwcmV2aW91cyAhPT0gY3dkUGF0aCkge1xuXHRcdHJlc3VsdC5wdXNoKHBhdGguam9pbihjd2RQYXRoLCAnbm9kZV9tb2R1bGVzLy5iaW4nKSk7XG5cdFx0cHJldmlvdXMgPSBjd2RQYXRoO1xuXHRcdGN3ZFBhdGggPSBwYXRoLnJlc29sdmUoY3dkUGF0aCwgJy4uJyk7XG5cdH1cblxuXHQvLyBFbnN1cmUgdGhlIHJ1bm5pbmcgYG5vZGVgIGJpbmFyeSBpcyB1c2VkXG5cdGNvbnN0IGV4ZWNQYXRoRGlyID0gcGF0aC5yZXNvbHZlKG9wdGlvbnMuY3dkLCBvcHRpb25zLmV4ZWNQYXRoLCAnLi4nKTtcblx0cmVzdWx0LnB1c2goZXhlY1BhdGhEaXIpO1xuXG5cdHJldHVybiByZXN1bHQuY29uY2F0KG9wdGlvbnMucGF0aCkuam9pbihwYXRoLmRlbGltaXRlcik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5wbVJ1blBhdGg7XG4vLyBUT0RPOiBSZW1vdmUgdGhpcyBmb3IgdGhlIG5leHQgbWFqb3IgcmVsZWFzZVxubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IG5wbVJ1blBhdGg7XG5cbm1vZHVsZS5leHBvcnRzLmVudiA9IG9wdGlvbnMgPT4ge1xuXHRvcHRpb25zID0ge1xuXHRcdGVudjogcHJvY2Vzcy5lbnYsXG5cdFx0Li4ub3B0aW9uc1xuXHR9O1xuXG5cdGNvbnN0IGVudiA9IHsuLi5vcHRpb25zLmVudn07XG5cdGNvbnN0IHBhdGggPSBwYXRoS2V5KHtlbnZ9KTtcblxuXHRvcHRpb25zLnBhdGggPSBlbnZbcGF0aF07XG5cdGVudltwYXRoXSA9IG1vZHVsZS5leHBvcnRzKG9wdGlvbnMpO1xuXG5cdHJldHVybiBlbnY7XG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/npm-run-path/index.js\n");

/***/ })

};
;