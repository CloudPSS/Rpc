{{
  import * as t from './parser-import.js';
}}

{
  let _doc = null;
  let mdoc = null;
  let fdoc = null;
  let sdoc = null;
  function doc() {
    const d = _doc;
    _doc = null;
    if (d) {
      return d;
    } else {
      return undefined;
    }
  }
}

start = "\uFEFF"? @Document

Document = __ headers:Header* definitions:Definition* __ { return new t.Document(headers, definitions); }

Header = @(Include / CppInclude / Namespace) __

Include
  = "include" _ file:Literal {
      doc();
      return new t.Include(location(), file);
    }

CppInclude
  = "cpp_include" _ file:Literal {
      doc();
      return new t.CppInclude(location(), file);
    }

Namespace
  = "namespace" _ scope:NamespaceScope _ namespace:Identifier {
      doc();
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
        sdoc = doc();
        return true;
      }
    type:FieldType
    _
    id:Identifier
    __
    "="
    __
    value:ConstValue
    __
    ListSeparator? {
      doc();
      return new t.Const(location(), type, id, value, sdoc);
    }

Typedef
  = "typedef"
    _
    & {
        sdoc = doc();
        return true;
      }
    type:DefinitionType
    _
    id:Identifier
    __
    ListSeparator? {
      doc();
      return new t.Typedef(location(), id, type, sdoc);
    }

Enum
  = "enum"
    _
    & {
        sdoc = doc();
        return true;
      }
    id:Identifier
    __
    "{"
    __
    values:(
      e:Identifier value:(__ "=" __ @IntConstant)? __ ListSeparator? __ {
          return new t.EnumValue(location(), e, value, doc());
        }
    )*
    __
    "}"
    __
    ListSeparator? {
      doc();
      return new t.Enum(location(), id, values, sdoc);
    }

Struct
  = "struct"
    _
    & {
        sdoc = doc();
        return true;
      }
    id:Identifier
    __
    "{"
    __
    fields:Field*
    __
    "}" {
      doc();
      return new t.Struct(location(), id, fields, sdoc);
    }

Union
  = "union"
    _
    & {
        sdoc = doc();
        return true;
      }
    id:Identifier
    __
    "{"
    __
    fields:Field*
    __
    "}" {
      doc();
      return new t.Union(location(), id, fields, sdoc);
    }

Exception
  = "exception"
    _
    & {
        sdoc = doc();
        return true;
      }
    id:Identifier
    __
    "{"
    __
    fields:Field*
    __
    "}" {
      doc();
      return new t.Exception(location(), id, fields, sdoc);
    }

Service
  = "service"
    _
    & {
        sdoc = doc();
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
      doc();
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
        fdoc = doc();
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
        mdoc = doc();
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
  = BaseType
  / ContainerType
  / Identifier

DefinitionType
  = BaseType
  / ContainerType

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
  = v:(DoubleConstant / IntConstant / Literal / Identifier / ConstList / ConstMap) {
      return new t.ConstValue(location(), v);
    }

DoubleConstant "number" = ("+" / "-")? [0-9]+ ("." [0-9]+)? (("E" / "e") IntConstant)? { return parseFloat(text()); }

IntConstant "integer" = ("+" / "-")? [0-9]+ { return parseInt(text(), 10); }

ConstList = "[" __ @(@ConstValue __ ListSeparator? __)* __ "]"

ConstMap
  = "{" __ i:(k:ConstValue __ ":" __ v:ConstValue __ ListSeparator? __ { return [k, v]; })* __ "}" {
      return new Map(i || []);
    }

Literal "Literal" = (("\"" [^"]* "\"") / ("'" [^']* "'")) { return new t.Literal(location(), text()); }

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

LineComment = "//" [^\r\n]*

BlockComment = "/*" [^*]* ("*" [^/]*)* "/"

DocComment = "/**" [^*]* ("*" [^/]*)* "/" { _doc = text().slice(3, -2).trim(); }
