# Code Citations

## License: unknown

https://github.com/foliojs/fontkit/blob/a5fe0a1834241dbc6eb02beea3b7414c118c5ac9/src/glyph/TTFGlyph.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/nikosxenakis/nikosxenakis.github.io/blob/76b34086e7930fea47fd01fb4fee899c087d25f3/docs/vendors.bundle.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/foliojs/fontkit/blob/a5fe0a1834241dbc6eb02beea3b7414c118c5ac9/src/glyph/TTFGlyph.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/nikosxenakis/nikosxenakis.github.io/blob/76b34086e7930fea47fd01fb4fee899c087d25f3/docs/vendors.bundle.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/foliojs/fontkit/blob/a5fe0a1834241dbc6eb02beea3b7414c118c5ac9/src/glyph/TTFGlyph.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/nikosxenakis/nikosxenakis.github.io/blob/76b34086e7930fea47fd01fb4fee899c087d25f3/docs/vendors.bundle.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/foliojs/fontkit/blob/a5fe0a1834241dbc6eb02beea3b7414c118c5ac9/src/glyph/TTFGlyph.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/nikosxenakis/nikosxenakis.github.io/blob/76b34086e7930fea47fd01fb4fee899c087d25f3/docs/vendors.bundle.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/foliojs/fontkit/blob/a5fe0a1834241dbc6eb02beea3b7414c118c5ac9/src/glyph/TTFGlyph.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/nikosxenakis/nikosxenakis.github.io/blob/76b34086e7930fea47fd01fb4fee899c087d25f3/docs/vendors.bundle.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/foliojs/fontkit/blob/a5fe0a1834241dbc6eb02beea3b7414c118c5ac9/src/glyph/TTFGlyph.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/nikosxenakis/nikosxenakis.github.io/blob/76b34086e7930fea47fd01fb4fee899c087d25f3/docs/vendors.bundle.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/foliojs/fontkit/blob/a5fe0a1834241dbc6eb02beea3b7414c118c5ac9/src/glyph/TTFGlyph.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```

## License: unknown

https://github.com/nikosxenakis/nikosxenakis.github.io/blob/76b34086e7930fea47fd01fb4fee899c087d25f3/docs/vendors.bundle.js

````
---

**Title: `TTFGlyph._getCBox()` throws `RangeError: Offset is outside the bounds of the DataView` for empty glyphs (e.g. space character)**

---

## Summary

`TTFGlyph._getCBox()` does not guard against empty glyphs before attempting to decode the glyph header, causing a `RangeError` when the glyph has no outline data in the `glyf` table. This affects every standard TrueType font because characters like space (U+0020) are legitimately empty glyphs.

## Environment

- **fontkit**: 2.0.4
- **Reproduction context**: browser environment (e.g. via `@react-pdf/renderer` 4.5.1 + Vite)

## Root Cause

In TrueType fonts, a glyph with no outline (e.g. space) is stored as a zero-length entry: `loca.offsets[id] === loca.offsets[id + 1]`. The `glyf` table has no bytes to read for such a glyph.

`_decode()` already handles this correctly:

```js
// TTFGlyph._decode() — correct ✓
_decode() {
    let glyfPos = this._font.loca.offsets[this.id];
    let nextPos = this._font.loca.offsets[this.id + 1];
    // Nothing to do if there is no data for this glyph
    if (glyfPos === nextPos) return null;
    // ...
}
````

But `_getCBox()` skips this check and immediately reads from the stream:

```js

```
