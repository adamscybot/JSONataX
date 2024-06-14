import 'ses';
import { deepFreeze } from '../lib/immutability.js';
export var EnvBuiltIns;
(function (EnvBuiltIns) {
    EnvBuiltIns["Sum"] = "sum";
    EnvBuiltIns["Count"] = "count";
    EnvBuiltIns["Max"] = "max";
    EnvBuiltIns["Min"] = "min";
    EnvBuiltIns["Average"] = "average";
    EnvBuiltIns["String"] = "string";
    EnvBuiltIns["Substring"] = "substring";
    EnvBuiltIns["SubstringBefore"] = "substringBefore";
    EnvBuiltIns["SubstringAfter"] = "substringAfter";
    EnvBuiltIns["Lowercase"] = "lowercase";
    EnvBuiltIns["Uppercase"] = "uppercase";
    EnvBuiltIns["Length"] = "length";
    EnvBuiltIns["Trim"] = "trim";
    EnvBuiltIns["Pad"] = "pad";
    EnvBuiltIns["Match"] = "match";
    EnvBuiltIns["Contains"] = "contains";
    EnvBuiltIns["Replace"] = "replace";
    EnvBuiltIns["Split"] = "split";
    EnvBuiltIns["Join"] = "join";
    EnvBuiltIns["FormatNumber"] = "formatNumber";
    EnvBuiltIns["FormatBase"] = "formatBase";
    EnvBuiltIns["FormatInteger"] = "formatInteger";
    EnvBuiltIns["ParseInteger"] = "parseInteger";
    EnvBuiltIns["Number"] = "number";
    EnvBuiltIns["Floor"] = "floor";
    EnvBuiltIns["Ceil"] = "ceil";
    EnvBuiltIns["Round"] = "round";
    EnvBuiltIns["Abs"] = "abs";
    EnvBuiltIns["Sqrt"] = "sqrt";
    EnvBuiltIns["Power"] = "power";
    EnvBuiltIns["Random"] = "random";
    EnvBuiltIns["Boolean"] = "boolean";
    EnvBuiltIns["Not"] = "not";
    EnvBuiltIns["Map"] = "map";
    EnvBuiltIns["Zip"] = "zip";
    EnvBuiltIns["Filter"] = "filter";
    EnvBuiltIns["Single"] = "single";
    EnvBuiltIns["Reduce"] = "reduce";
    EnvBuiltIns["Sift"] = "sift";
    EnvBuiltIns["Keys"] = "keys";
    EnvBuiltIns["Lookup"] = "lookup";
    EnvBuiltIns["Append"] = "append";
    EnvBuiltIns["Exists"] = "exists";
    EnvBuiltIns["Spread"] = "spread";
    EnvBuiltIns["Merge"] = "merge";
    EnvBuiltIns["Reverse"] = "reverse";
    EnvBuiltIns["Each"] = "each";
    EnvBuiltIns["Error"] = "error";
    EnvBuiltIns["Assert"] = "assert";
    EnvBuiltIns["Type"] = "type";
    EnvBuiltIns["Sort"] = "sort";
    EnvBuiltIns["Shuffle"] = "shuffle";
    EnvBuiltIns["Distinct"] = "distinct";
    EnvBuiltIns["Base64encode"] = "base64encode";
    EnvBuiltIns["Base64decode"] = "base64decode";
    EnvBuiltIns["EncodeUrlComponent"] = "encodeUrlComponent";
    EnvBuiltIns["EncodeUrl"] = "encodeUrl";
    EnvBuiltIns["DecodeUrlComponent"] = "decodeUrlComponent";
    EnvBuiltIns["DecodeUrl"] = "decodeUrl";
    EnvBuiltIns["Eval"] = "eval";
    EnvBuiltIns["ToMillis"] = "toMillis";
    EnvBuiltIns["FromMillis"] = "fromMillis";
    EnvBuiltIns["Clone"] = "clone";
})(EnvBuiltIns || (EnvBuiltIns = {}));
export var EnvBuiltInsInternal;
(function (EnvBuiltInsInternal) {
    EnvBuiltInsInternal["EvaluateEntry"] = "__evaluate_entry";
    EnvBuiltInsInternal["EvaluateExit"] = "__evaluate_exit";
})(EnvBuiltInsInternal || (EnvBuiltInsInternal = {}));
export const BuiltInsCapabilities = deepFreeze({
    regexInputs: [
        EnvBuiltIns.Match,
        EnvBuiltIns.Replace,
        EnvBuiltIns.Split,
        EnvBuiltIns.Contains,
    ],
});
/**
 * An object containing whitelist presets (lists of built in functions to allow)
 * to match various security postures.
 */
export const BuiltInsWhitelistPresets = deepFreeze({
    /** All of the JSONata built-ins */
    all: Object.values(EnvBuiltIns),
    /**  */
});
// export const captureBuiltins = () => {
//   jsonata()
// }
