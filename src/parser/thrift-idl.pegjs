{{
  import * as t from './parser-import.js';
}}

{
  const debug = options.debug ? console.debug : () => {};
  let _doc = null;
  let mdoc = null;
  let fdoc = null;
  let sdoc = null;

  function doc(pos) {
    const d = _doc;
    _doc = null;
    if (d) {
      debug('pop', pos, d);
      return d;
    } else {
      debug('pop', pos, undefined);
      return undefined;
    }
  }
}

start = "\uFEFF"? @Document

Document = __ headers:Header* definitions:Definition* __ { return new t.Document(headers, definitions); }

Header = @(Include / CppInclude / Namespace) __

Include
  = "include" _ file:Literal {
      doc("include_end");
      return new t.Include(location(), file);
    }

CppInclude
  = "cpp_include" _ file:Literal {
      doc("cpp_include_end");
      return new t.CppInclude(location(), file);
    }

Namespace
  = "namespace" _ scope:NamespaceScope _ namespace:Identifier {
      doc("namespace_end");
      return new t.Namespace(location(), scope, namespace);
    }

NamespaceScope
  = "*"
  / Identifier { return text(); }

Definition = @(Const / Typedef / Enum / Struct / Union / Exception / Service) __

Const
  = "const"
    _
    & {
        sdoc = doc("const");
        return true;
      }
    type:FieldType
    _
    id:Identifier
    __
    "="
    __
    value:ConstValue
    & {
        doc("const_end");
        return true;
      }
    __
    ListSeparator? {
      return new t.Const(location(), type, id, value, sdoc);
    }

Typedef
  = "typedef"
    _
    & {
        sdoc = doc("typedef");
        return true;
      }
    type:FieldType
    _
    id:Identifier
    & {
        doc("typedef_end");
        return true;
      }
    __
    ListSeparator? {
      return new t.Typedef(location(), id, type, sdoc);
    }

Enum
  = "enum"
    _
    & {
        sdoc = doc("enum");
        return true;
      }
    id:Identifier
    __
    "{"
    __
    values:(
      e:Identifier value:(__ "=" __ @IntConstant)? __ ListSeparator? __ {
          return new t.EnumValue(location(), e, value, doc("enum_value_end"));
        }
    )*
    __
    "}" {
      doc("enum_end");
      return new t.Enum(location(), id, values, sdoc);
    }

Struct
  = "struct"
    _
    & {
        sdoc = doc("struct");
        debug(1,sdoc);
        return true;
      }
    id:Identifier
    __
    "{"
    __
    fields:Field*
    __
    "}" {
      doc("struct_end");
      return new t.Struct(location(), id, fields, sdoc);
    }

Union
  = "union"
    _
    & {
        sdoc = doc("union");
        return true;
      }
    id:Identifier
    __
    "{"
    __
    fields:Field*
    __
    "}" {
      doc("union_end");
      return new t.Union(location(), id, fields, sdoc);
    }

Exception
  = "exception"
    _
    & {
        sdoc = doc("exception");
        return true;
      }
    id:Identifier
    __
    "{"
    __
    fields:Field*
    __
    "}" {
      doc("exception_end");
      return new t.Exception(location(), id, fields, sdoc);
    }

Service
  = "service"
    _
    & {
        sdoc = doc("service");
        return true;
      }
    id:Identifier
    base:(_ "extends" _ @Identifier)?
    __
    "{"
    __
    methods:Function*
    __
    "}" {
      doc("service_end");
      return new t.Service(location(), id, base, methods, sdoc);
    }

Field
  = id:FieldID?
    required:FieldReq?
    __
    type:FieldType
    _
    name:Identifier
    & {
        fdoc = doc("field");
        return true;
      }
    def:(__ "=" __ @ConstValue)?
    __
    ListSeparator? { return new t.Field(location(), id, required, type, name, def, fdoc); }

FieldID = @IntConstant __ ":" __

FieldReq
  = "required" { return true; }
  / "optional" { return false; }

Function
  = oneway:"oneway"?
    __
    result:FunctionType
    _
    id:Identifier
    & {
        mdoc = doc("function");
        return true;
      }
    __
    "("
    __
    params:Field*
    __
    ")"
    __
    throws:Throws?
    __
    ListSeparator? { return new t.Method(location(), result, id, params, throws, oneway != null, mdoc); }

FunctionType
  = "void" { return new t.BaseType(location(), 'void'); }
  / FieldType

Throws = "throws" __ "(" __ @Field* __ ")"

FieldType
  = ContainerType
  / id:Identifier {
    if (t.BaseTypeName.includes(id.name)) {
      return new t.BaseType(id.location, id.name);
    }
    return id;
  }

BaseType
  = ("bool" / "byte" / "i8" / "i16" / "i32" / "i64" / "double" / "string" / "binary") {
      return new t.BaseType(location(), text());
    }

ContainerType
  = MapType
  / SetType
  / ListType

MapType
  = "map" (_ CppType)? __ "<" __ k:FieldType __ "," __ v:FieldType __ ">" {
      return new t.ContainerType(location(), 'map', [k, v]);
    }

SetType = "set" (_ CppType)? __ "<" __ k:FieldType __ ">" { return new t.ContainerType(location(), 'set', [k]); }

ListType = "list" __ "<" __ i:FieldType __ ">" (__ CppType)? { return new t.ContainerType(location(), 'list', [i]); }

CppType = "cpp_type" _ Literal

ConstValue
  = v:(HexConstant / DoubleConstant / IntConstant / Literal / Identifier / ConstList / ConstMap) {
      return new t.ConstValue(location(), v);
    }

DoubleConstant "number" = ("+" / "-")? [0-9]+ ("." [0-9]+)? (("E" / "e") IntConstant)? { return parseFloat(text()); }

HexConstant "hex integer" 
  = ("+" / "-")? "0x" [0-9a-fA-F]+ { return parseInt(text(), 16); }

IntConstant "integer" 
  = ("+" / "-")? [0-9]+ { return parseInt(text(), 10); }

ConstList = "[" __ @(@ConstValue __ ListSeparator? __)* __ "]"

ConstMap
  = "{" __ i:(k:ConstValue __ ":" __ v:ConstValue __ ListSeparator? __ { return [k, v]; })* __ "}" {
      return new Map(i || []);
    }

EscapedChar
  = "\\"
    @(
        '"'
      / "'"
      / "\\"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$([0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )

Literal "Literal" 
  = chars:(("\"" @(EscapedChar / [^"])* "\"") / ("'" @(EscapedChar / [^'])* "'")) { return new t.Literal(location(), chars.join('')); }

Identifier "Identifier" = [a-zA-Z_] [a-zA-Z0-9._]* { return new t.Identifier(location(), text()); }

ListSeparator "separator"
  = [,;] __
  / _

_ "whitespace" = Whitespace+

__ "whitespace" = Whitespace*

Whitespace
  = Empty
  / DocComment
  / BlockComment
  / LineComment

Empty = [ \t\r\n]

LineComment = ("//" / "#") [^\r\n]*

BlockComment = "/*" [^*]* ("*" [^/]*)* "/"

DocComment = "/**" [^*]* ("*" [^/]*)* "/" { 
  _doc = t.trimDoc(text());
  debug('push', _doc)
}
