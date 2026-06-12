(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AIPostureDeclarationValidator = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var LEVEL_NAMES = ['N/A', 'Perceiving', 'Assessing', 'Integrating', 'Calibrating', 'Engineering'];
  var VECTORS = ['People', 'Infrastructure', 'Regulation'];

  var DECLARATION_SCHEMA = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://aiposture.org/schema/declaration/v1/ai-posture-declaration.schema.json',
    title: 'AI Posture Declaration',
    description: 'A machine-readable AI Posture assertion published at /.well-known/ai-posture.json.',
    type: 'object',
    additionalProperties: false,
    required: ['type', 'spec_version', 'generated_at', 'next_review', 'subject', 'assertion_basis', 'aggregate', 'constraining_vectors', 'vectors'],
    properties: {
      type: { const: 'AI Posture Declaration' },
      spec_version: { type: 'string', pattern: '^v\\d+\\.\\d+(\\.\\d+)?$' },
      generated_at: { type: 'string', format: 'date-time' },
      next_review: { type: 'string', format: 'date' },
      subject: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'domain'],
        properties: {
          name: { type: 'string', minLength: 1 },
          domain: { type: 'string', format: 'uri' },
          scope: { type: 'string', minLength: 1 }
        }
      },
      assertion_basis: { type: 'string', enum: ['self-estimate', 'self-assertion', 'verified'] },
      aggregate: {
        type: 'object',
        additionalProperties: false,
        required: ['level', 'level_name'],
        properties: {
          level: { type: ['integer', 'null'], minimum: 1, maximum: 5 },
          level_name: { type: 'string', enum: LEVEL_NAMES }
        }
      },
      constraining_vectors: {
        type: 'array',
        items: { enum: ['Infrastructure', 'Regulation', 'People'] },
        uniqueItems: true
      },
      vectors: {
        type: 'object',
        additionalProperties: false,
        required: ['Infrastructure', 'Regulation', 'People'],
        properties: {
          Infrastructure: { $ref: '#/$defs/vector_declaration' },
          Regulation: { $ref: '#/$defs/vector_declaration' },
          People: { $ref: '#/$defs/vector_declaration' }
        }
      },
      evidence: {
        type: 'object',
        additionalProperties: false,
        properties: {
          Infrastructure: { $ref: '#/$defs/evidence_list' },
          Regulation: { $ref: '#/$defs/evidence_list' },
          People: { $ref: '#/$defs/evidence_list' }
        }
      }
    },
    $defs: {
      vector_declaration: {
        type: 'object',
        additionalProperties: false,
        required: ['in_scope', 'level', 'level_name', 'at_level_since'],
        properties: {
          in_scope: { type: 'boolean' },
          level: { type: ['integer', 'null'], minimum: 1, maximum: 5 },
          level_name: { type: 'string', enum: LEVEL_NAMES },
          at_level_since: { type: ['string', 'null'], format: 'date' },
          posterior: {
            type: 'array',
            minItems: 6,
            maxItems: 6,
            items: { type: 'number', minimum: 0, maximum: 1 }
          }
        }
      },
      evidence_list: {
        type: 'array',
        items: { type: 'string', format: 'uri' }
      }
    }
  };

  function isDate(s) {
    if (typeof s !== 'string') return false;
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    var y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    var dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  }

  function isDateTime(s) {
    if (typeof s !== 'string') return false;
    var m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
    if (!m || !isDate(m[1])) return false;
    var hh = Number(m[2]), mm = Number(m[3]), ss = Number(m[4]);
    return hh <= 23 && mm <= 59 && ss <= 59 && !Number.isNaN(Date.parse(s));
  }

  function isUri(s) {
    return typeof s === 'string' && /^[a-z][a-z0-9+.-]*:\S/i.test(s);
  }

  function typeOf(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (Number.isInteger(v)) return 'integer';
    return typeof v;
  }

  function checkType(v, t) {
    if (Array.isArray(t)) return t.some(function (x) { return checkType(v, x); });
    if (t === 'integer') return Number.isInteger(v);
    if (t === 'number') return typeof v === 'number';
    if (t === 'null') return v === null;
    return typeOf(v) === t;
  }

  function resolveRef(ref, rootSchema) {
    var m = ref.match(/^#\/\$defs\/(.+)$/);
    if (!m || !rootSchema.$defs || !rootSchema.$defs[m[1]]) throw new Error('unsupported $ref: ' + ref);
    return rootSchema.$defs[m[1]];
  }

  function validateAgainst(schema, value, rootSchema, pathStr, errors) {
    if (schema.$ref) schema = resolveRef(schema.$ref, rootSchema);
    if ('const' in schema && value !== schema.const) {
      errors.push(pathStr + ': must equal ' + JSON.stringify(schema.const));
      return;
    }
    if (schema.enum && schema.enum.indexOf(value) < 0) errors.push(pathStr + ': must be one of ' + JSON.stringify(schema.enum));
    if (schema.type && !checkType(value, schema.type)) {
      errors.push(pathStr + ': expected type ' + JSON.stringify(schema.type) + ', got ' + typeOf(value));
      return;
    }
    if (typeof value === 'string') {
      if (schema.minLength != null && value.length < schema.minLength) errors.push(pathStr + ': shorter than minLength ' + schema.minLength);
      if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) errors.push(pathStr + ': does not match pattern ' + schema.pattern);
      if (schema.format === 'date' && !isDate(value)) errors.push(pathStr + ': not a valid date');
      if (schema.format === 'date-time' && !isDateTime(value)) errors.push(pathStr + ': not a valid date-time');
      if (schema.format === 'uri' && !isUri(value)) errors.push(pathStr + ': not a valid URI');
    }
    if (typeof value === 'number') {
      if (schema.minimum != null && value < schema.minimum) errors.push(pathStr + ': below minimum ' + schema.minimum);
      if (schema.maximum != null && value > schema.maximum) errors.push(pathStr + ': above maximum ' + schema.maximum);
    }
    if (Array.isArray(value)) {
      if (schema.minItems != null && value.length < schema.minItems) errors.push(pathStr + ': fewer than minItems ' + schema.minItems);
      if (schema.maxItems != null && value.length > schema.maxItems) errors.push(pathStr + ': more than maxItems ' + schema.maxItems);
      if (schema.uniqueItems && new Set(value.map(function (v) { return JSON.stringify(v); })).size !== value.length) errors.push(pathStr + ': items must be unique');
      if (schema.items) value.forEach(function (it, i) { validateAgainst(schema.items, it, rootSchema, pathStr + '[' + i + ']', errors); });
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      var props = schema.properties || {};
      (schema.required || []).forEach(function (k) {
        if (!(k in value)) errors.push(pathStr + ': missing required property "' + k + '"');
      });
      Object.keys(value).forEach(function (k) {
        if (props[k]) validateAgainst(props[k], value[k], rootSchema, pathStr + '.' + k, errors);
        else if (schema.additionalProperties === false) errors.push(pathStr + ': unexpected property "' + k + '"');
      });
    }
  }

  function declarationSemantics(d, errors, warnings) {
    var inScope = VECTORS.filter(function (v) { return d.vectors && d.vectors[v] && d.vectors[v].in_scope; });
    if (d.assertion_basis === 'verified') errors.push('assertion_basis "verified" is reserved and MUST NOT be used until a verification process is specified');
    VECTORS.forEach(function (v) {
      var e = d.vectors && d.vectors[v];
      if (!e) return;
      if (e.in_scope === false && (e.level !== null || e.level_name !== 'N/A')) errors.push('vectors.' + v + ': in_scope false must have level null and level_name "N/A"');
      if (e.in_scope === true && (e.level == null || e.level_name === 'N/A')) errors.push('vectors.' + v + ': in_scope true must have a level 1-5 and a non-N/A level_name');
      if (e.level != null && e.level_name && LEVEL_NAMES[e.level] !== e.level_name) errors.push('vectors.' + v + ': level ' + e.level + ' does not match level_name "' + e.level_name + '"');
    });
    if (inScope.length === 0) {
      if (d.aggregate && d.aggregate.level !== null) errors.push('aggregate.level must be null when all vectors are N/A');
      if (d.aggregate && d.aggregate.level_name !== 'N/A') errors.push('aggregate.level_name must be "N/A" when all vectors are N/A');
      if ((d.constraining_vectors || []).length !== 0) errors.push('constraining_vectors must be empty when all vectors are N/A');
    } else {
      var levels = inScope.map(function (v) { return d.vectors[v].level; });
      var min = Math.min.apply(null, levels);
      if (d.aggregate.level !== min) errors.push('aggregate.level ' + d.aggregate.level + ' must equal the minimum in-scope vector level ' + min);
      if (LEVEL_NAMES[min] !== d.aggregate.level_name) errors.push('aggregate.level_name "' + d.aggregate.level_name + '" must match aggregate.level ' + min);
      var constraining = inScope.filter(function (v) { return d.vectors[v].level === min; }).sort();
      var declared = (d.constraining_vectors || []).slice().sort();
      if (JSON.stringify(constraining) !== JSON.stringify(declared)) {
        errors.push('constraining_vectors ' + JSON.stringify(declared) + ' must equal in-scope vectors at the minimum ' + JSON.stringify(constraining));
      }
    }
    if (d.next_review && isDate(d.next_review) && Date.parse(d.next_review) < Date.now()) {
      warnings.push('declaration is stale: next_review ' + d.next_review + ' is in the past (weight as a weaker signal)');
    }
  }

  function validateDeclaration(d) {
    var errors = [], warnings = [];
    if (!d || typeof d !== 'object' || Array.isArray(d)) return { errors: ['declaration: expected JSON object'], warnings: [] };
    validateAgainst(DECLARATION_SCHEMA, d, DECLARATION_SCHEMA, 'declaration', errors);
    if (errors.length === 0) declarationSemantics(d, errors, warnings);
    return { errors: errors, warnings: warnings };
  }

  return {
    DECLARATION_SCHEMA: DECLARATION_SCHEMA,
    LEVEL_NAMES: LEVEL_NAMES,
    VECTORS: VECTORS,
    isDate: isDate,
    isDateTime: isDateTime,
    isUri: isUri,
    validateDeclaration: validateDeclaration
  };
});
