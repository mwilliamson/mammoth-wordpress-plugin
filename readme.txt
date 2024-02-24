=== Mammoth .docx converter ===
Contributors: michaelwilliamson
Donate link: https://liberapay.com/mwilliamson/donate
Tags: docx, html, word, office, paste
Requires at least: 4.0
Tested up to: 6.4.3
Stable tag: 1.21.0
License: BSD 2-clause
License URI: http://opensource.org/licenses/BSD-2-Clause

Mammoth converts semantically marked up .docx documents to simple and clean HTML, allowing pasting from Word documents and Google Docs without the usual mess.

== Description ==

Mammoth is designed to convert .docx documents, such as those created by Microsoft Word, Google Docs and LibreOffice, and convert them to HTML. Mammoth aims to produce simple and clean HTML by using semantic information in the document, and ignoring other details. For instance, Mammoth converts any paragraph with the style `Heading1` to `h1` elements, rather than attempting to exactly copy the styling (font, text size, colour, etc.) of the heading. This allows you to paste from Word documents without the usual mess.

There's a large mismatch between the structure used by .docx and the structure of HTML, meaning that the conversion is unlikely to be perfect for more complicated documents. Mammoth works best if you only use styles to semantically mark up your document.

The following features are currently supported:

* Headings.

* Lists.

* Tables. The formatting of the table itself, such as borders, is currently ignored, but the formatting of the text is treated the same as in the rest of the document.

* Footnotes and endnotes.

* Images.

* Bold, italics, superscript and subscript.

* Links.

* Text boxes. The contents of the text box are treated as a separate paragraph that appears after the paragraph containing the text box.

= Embedded style maps =

By default, Mammoth maps some common .docx styles to HTML elements. For instance, a paragraph with the style name `Heading 1` is converted to a `h1` element. If you have a document with your own custom styles, you can use an embedded style map to tell Mammoth how those styles should be mapped. For instance, you could convert paragraphs with the style named `WarningHeading` to `h1` elements with `class="warning"` with the style mapping:

    p[style-name='WarningHeading'] => h1.warning:fresh

[An online tool](http://mike.zwobble.org/projects/mammoth/embed-style-map/) can be used to embed style maps into an existing document. Details of [how to write style maps can be found on the mammoth.js documentation](https://github.com/mwilliamson/mammoth.js#writing-style-maps).

A style map to be used for all documents can be set by configuring Mammoth (see below).

= Configuration =

Mammoth can be configured by writing a separate plugin. For instance, [this example plugin](https://github.com/mwilliamson/mammoth-wordpress-plugin/tree/master/examples/options-plugin) adds a custom style map, and uses a document transform to detect paragraphs of monospace text and converts them to paragraphs with the style "Code Block".

As a WordPress plugin, Mammoth uses the JavaScript library mammoth.js to convert documents. Mammoth will use the JavaScript global `MAMMOTH_OPTIONS` whenever calling mammoth.js, which allows for some customisation. `MAMMOTH_OPTIONS` should be defined as a function that returns an options object. This options object will then be passed in as the `options` argument to `convertToHtml`. The [mammoth.js docs](https://github.com/mwilliamson/mammoth.js) describe the various options available.

The global `MAMMOTH_OPTIONS` will be called with `mammoth` as the first argument. This can be useful if you need to use a function from mammoth.js, such as `mammoth.transforms.getDescendantsOfType`.

= FAQs =

[Answers to some frequently asked questions about Mammoth](https://mike.zwobble.org/projects/mammoth/faqs/).

== Installation ==

Install the plugin in the usual way, and you should be able to use the Mammoth .docx converter when adding a post. If you can't see the meta box, make sure that it's selected by taking a look at the "Screen Options" for adding a post.

== Changelog ==

= 1.21.0 =

* Update mammoth.js to 1.7.0. This includes support for documents in the strict format.

= 1.20.0 =

* Update mammoth.js to 1.4.21. This includes improved underline support and image handling.

= 1.19.0 =

* Update mammoth.js to 1.4.18. This includes better support for internal hyperlinks.

= 1.18.0 =

* Update mammoth.js to 1.4.17. This includes better support for numbering, and conversion of symbols to their corresponding Unicode characters.

= 1.17.0 =

* Update mammoth.js to 1.4.13. This includes support for soft hyphens and improved underline support.

= 1.16.0 =

* Improve support for detecting when the Gutenberg editor is active. This should fix compatibility with some other plugins such as Yoast SEO when the Gutenberg editor is disabled.

= 1.15.0 =

* Update mammoth.js to 1.4.9.

= 1.14.0 =

* Improve support when X-Frame-Options is set to "deny".

= 1.13.0 =

* Update mammoth.js to 1.4.8.

= 1.12.0 =

* Add basic Gutenberg support.

* Update mammoth.js to 1.4.7.

= 1.11.0 =

* Fix IE11 support.

= 1.10.0 =

* Add workaround for a bug in tinyMCE in WordPress 4.9.6.

= 1.9.0 =

* Update mammoth.js to 1.4.6. This includes preservation of whitespace in pre elements, and paragraphs in endnotes, footnotes and comments.

= 1.8.0 =

* Update mammoth.js to 1.4.4. This includes better support for reading documents created by Word Online.

= 1.7.0 =

* Update mammoth.js to 1.4.2. This includes improved handling of grouped objects and non-breaking hyphens.

= 1.6.0 =

* Allow MAMMOTH_OPTIONS to override idPrefix.

* Update mammoth.js to 1.4.0. This includes improved handling of hyperlinks, and converts table headers into thead elements.

= 1.5.0 =

* Handle unsuccessful image uploads where the HTTP request succeeds, but WordPress rejects the file. Fixes an issue where documents with EMF images couldn't be imported.

* Update mammoth.js to 1.3.2. This includes a fix for documents where images are referenced by a URI relative to the base URI.

= 1.4.0 =

* Update mammoth.js to 1.3.1. This includes new ways to map styles, such as style name prefixes.

* Improve styling of preview to match the editor.

* Fix a bug where images wouldn't upload on certain server configurations.

* Allow options to be passed to mammoth.js through a MAMMOTH_OPTIONS global variable.

= 1.3.0 =

* Update mammoth.js to 1.2.5. This includes better support for image alt text and boolean run properties (bold, italic, underline and strikethrough).

= 1.2.0 =

* Include wp-image-* class when inserting images. This allows the WordPress editor to correctly identify the image and show appropriate editing options.

* If an image has an alt text description in the original document, set the alt text in the media library when uploading that image.

* If an image has an alt text description in the original document, use it to generate the filename.

* Set image filename extension based on the image content type.

* Show a message while the document is being inserted.

= 1.1.0 =

* Update mammoth.js to 1.1.0. This includes support for merged table cells and content controls, such as bibliographies. This should also improve performance when converting larger documents.

= 1.0.0 =

* Update mammoth.js to 0.3.33. This includes better support for reading documents that use undefined styles, and generates simpler HTML in some cases.

= 0.1.25 =

* Update mammoth.js to 0.3.30. This includes better support for lists made in LibreOffice.

* Fix JavaScript error on admin pages without editors.

= 0.1.24 =

* Update mammoth.js to 0.3.29. This improves support for mc:AlternateContent elements.

= 0.1.23 =

* Update mammoth.js to 0.3.28. This improves support for reading images.

= 0.1.22 =

* Update mammoth.js to 0.3.28-pre.1. Fixes newlines being inserted around inline elements when the editor is in text mode.

= 0.1.21 =

* Update mammoth.js to 0.3.27. Fixes recursive collapsing of HTML elements.

= 0.1.20 =

* Update mammoth.js to 0.3.26. Improves the collapsing of HTML elements, such as allowing collapsing elements generated by different runs.

= 0.1.19 =

* Update mammoth.js to 0.3.25-pre.1. Includes experimental support for embedded style maps.

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

* Update mammoth.js to 0.3.11. Includes support for superscript and subscript text.

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

== Donations ==

If you'd like to say thanks, feel free to [make a donation through Ko-fi](https://ko-fi.com/S6S01MG20).

If you use Mammoth as part of your business, please consider supporting the ongoing maintenance of Mammoth by [making a weekly donation through Liberapay](https://liberapay.com/mwilliamson/donate).
