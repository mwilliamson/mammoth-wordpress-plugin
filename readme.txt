=== Mammoth .docx converter ===
Contributors: michaelwilliamson
Tags: docx, html, word, office, paste
Requires at least: 3.5
Tested up to: 4.2.2
Stable tag: 0.1.18
License: BSD 2-clause
License URI: http://opensource.org/licenses/BSD-2-Clause

Mammoth converts semantically marked up .docx documents to simple and clean HTML, allowing pasting from Word documents without the usual mess.

== Description ==

Mammoth is designed to convert .docx documents,
such as those created by Microsoft Word,
and convert them to HTML.
Mammoth aims to produce simple and clean HTML by using semantic information in the document,
and ignoring other details.
For instance,
Mammoth converts any paragraph with the style `Heading1` to `h1` elements,
rather than attempting to exactly copy the styling (font, text size, colour, etc.) of the heading.
This allows you to paste from Word documents without the usual mess.

There's a large mismatch between the structure used by .docx and the structure of HTML,
meaning that the conversion is unlikely to be perfect for more complicated documents.
Mammoth works best if you only use styles to semantically mark up your document.

The following features are currently supported:

* Headings.

* Lists.

* Tables.
  The formatting of the table itself, such as borders, is currently ignored,
  but the formatting of the text is treated the same as in the rest of the document.
  
* Footnotes and endnotes.

* Images.

* Bold, italics, superscript and subscript.

* Links.

* Text boxes. The contents of the text box are treated as a separate paragraph
  that appears after the paragraph containing the text box.

== Installation ==

Install the plugin in the usual way,
and you should be able to use the Mammoth .docx converter when adding a post.
If you can't see the meta box,
make sure that it's selected by taking a look at the "Screen Options" for adding a post.

== Changelog ==

= 0.1.18 =

* Update mammoth.js to 0.3.23. Includes support for links and images in footnotes and endnotes.

= 0.1.17 =

* Update mammoth.js to 0.3.22. Includes support for strikethrough.

= 0.1.16 =

* Update mammoth.js to 0.3.21. Includes basic support for text boxes.

= 0.1.15 =

* Update mammoth.js to 0.3.18. Includes support for hyperlinks to bookmarks in the same document.

* Add support for CKEditor.

= 0.1.14 =

* Support any post type that supports the WordPress editor.

* Generate consistent footnote and endnote IDs based on the post ID.

* Update mammoth.js to 0.3.15.

= 0.1.13 =

* Update mammoth.js to 0.3.14. Includes support for endnotes.

= 0.1.12 =

* Fix preview rendering on Chrome.

* Update mammoth.js to 0.3.12.

= 0.1.11 =

* Update mammoth.js to 0.3.11. Includes support for superscript and subscript
  text.

= 0.1.10 =

* Update mammoth.js to 0.3.8. Includes support for line breaks.

= 0.1.9 =

* Remove old script reference.

= 0.1.8 =

* Update to mammoth.js 0.3.5. Includes support for tables.

= 0.1.7 =

* Update to mammoth.js 0.3.2. Includes support for footnotes.

= 0.1.6 =

* Update to mammoth.js 0.2.2

* Pretty print HTML output

* Hide inline image data in raw HTML preview

= 0.1.5 =

* Fix versions

= 0.1.4 =

* Fix readme.txt

= 0.1.3 =

* Update to the latest version of mammoth.js (0.2.1)

= 0.1 =

* Initial release
