export const enum Enum {
  ArrayType = 'ArrayType',
  BooleanType = 'BooleanType',
  NumberType = 'NumberType',
  StringType = 'StringType',
  NullType = 'NullType',
  ObjectType = 'ObjectType',
  FunctionType = 'FunctionType',
  JsonType = 'JsonType',
  AnyType = 'AnyType',
  OneOrMoreModifier = 'OneOrMoreModifier',
  OptionalModifier = 'OptionalModifier',
  ContextAwareModifier = 'ContextAwareModifier',
  UnionOpen = 'UnionOpen',
  UnionClose = 'UnionClose',
  SubTypeOpen = 'SubTypeOpen',
  SubTypeClose = 'SubTypeClose',
  ReturnSeparator = 'ReturnSeparator',
}

export type GenericTypeTokenChars = {
  [Enum.ArrayType]: 'a'
  [Enum.FunctionType]: 'f'
}

export type TypeTokenChars = GenericTypeTokenChars & {
  [Enum.BooleanType]: 'b'
  [Enum.NumberType]: 'n'
  [Enum.StringType]: 's'
  [Enum.NullType]: 'l'
  [Enum.ObjectType]: 'o'
  [Enum.JsonType]: 'j'
  [Enum.AnyType]: 'x'
}

export type ModifierTokenChars = {
  [Enum.OneOrMoreModifier]: '+'
  [Enum.OptionalModifier]: '?'
  [Enum.ContextAwareModifier]: '-'
}

export type DelimiterTokenChars = {
  [Enum.UnionOpen]: '('
  [Enum.UnionClose]: ')'
  [Enum.SubTypeOpen]: '<'
  [Enum.SubTypeClose]: '>'
  [Enum.ReturnSeparator]: ':'
}

export type TokenChars = TypeTokenChars &
  ModifierTokenChars &
  DelimiterTokenChars

export type CharOf<Token extends Enum> = TokenChars[Token]

type ReverseLookup<T, V> = {
  [P in keyof T]: T[P] extends V ? P : never
}[keyof T]

// TokenFor type for looking up Enum based on character
export type TokenOf<Char extends string> =
  ReverseLookup<TokenChars, Char> extends never
    ? false
    : ReverseLookup<TokenChars, Char>

export type PrintToken<Token extends Enum> = `${Token} '${CharOf<Token>}'`
