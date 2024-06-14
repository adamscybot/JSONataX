import 'ses';
export declare enum EnvBuiltIns {
    Sum = "sum",
    Count = "count",
    Max = "max",
    Min = "min",
    Average = "average",
    String = "string",
    Substring = "substring",
    SubstringBefore = "substringBefore",
    SubstringAfter = "substringAfter",
    Lowercase = "lowercase",
    Uppercase = "uppercase",
    Length = "length",
    Trim = "trim",
    Pad = "pad",
    Match = "match",
    Contains = "contains",
    Replace = "replace",
    Split = "split",
    Join = "join",
    FormatNumber = "formatNumber",
    FormatBase = "formatBase",
    FormatInteger = "formatInteger",
    ParseInteger = "parseInteger",
    Number = "number",
    Floor = "floor",
    Ceil = "ceil",
    Round = "round",
    Abs = "abs",
    Sqrt = "sqrt",
    Power = "power",
    Random = "random",
    Boolean = "boolean",
    Not = "not",
    Map = "map",
    Zip = "zip",
    Filter = "filter",
    Single = "single",
    Reduce = "reduce",
    Sift = "sift",
    Keys = "keys",
    Lookup = "lookup",
    Append = "append",
    Exists = "exists",
    Spread = "spread",
    Merge = "merge",
    Reverse = "reverse",
    Each = "each",
    Error = "error",
    Assert = "assert",
    Type = "type",
    Sort = "sort",
    Shuffle = "shuffle",
    Distinct = "distinct",
    Base64encode = "base64encode",
    Base64decode = "base64decode",
    EncodeUrlComponent = "encodeUrlComponent",
    EncodeUrl = "encodeUrl",
    DecodeUrlComponent = "decodeUrlComponent",
    DecodeUrl = "decodeUrl",
    Eval = "eval",
    ToMillis = "toMillis",
    FromMillis = "fromMillis",
    Clone = "clone"
}
export declare enum EnvBuiltInsInternal {
    EvaluateEntry = "__evaluate_entry",
    EvaluateExit = "__evaluate_exit"
}
export declare const BuiltInsCapabilities: import("../lib/immutability.js")._DeepReadonlyObject<{
    regexInputs: EnvBuiltIns[];
}>;
/**
 * An object containing whitelist presets (lists of built in functions to allow)
 * to match various security postures.
 */
export declare const BuiltInsWhitelistPresets: import("../lib/immutability.js")._DeepReadonlyObject<{
    all: EnvBuiltIns[];
}>;
