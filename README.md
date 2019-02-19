# HTML Escape Extension

[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://raw.githubusercontent.com/cfjedimaster/htmlescape-vscode/master/LICENSE)
[![Version](https://vsmarketplacebadge.apphb.com/version/raymondcamden.htmlescape-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=raymondcamden.htmlescape-vscode-extension)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/raymondcamden.htmlescape-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=raymondcamden.htmlescape-vscode-extension)
[![Ratings](https://vsmarketplacebadge.apphb.com/rating/raymondcamden.htmlescape-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=raymondcamden.htmlescape-vscode-extension)

This is a Visual Studio Code extension that simply converts any text into web-ready text that can be used in a blog entry. So for example, a `&lt;` character will become `&amp;lt;`. 

To use, simply open a file and run `Show Escaped HTML`. If no text is selected, it will convert the entire document.

![Example](images/preview.gif)

## License
[MIT](LICENSE)

## Third-Party Notice

* [escape-html](https://github.com/component/escape-html) for text escapement

# Updates

0.0.5 Merge PR by Oleg Karasik (https://github.com/cfjedimaster/htmlescape-vscode/pull/1)

0.0.4 I switched the code to copy/mimic this MS example (https://github.com/Microsoft/vscode-extension-samples/tree/master/previewhtml-sample) and it seems to have fixed the copy/paste issue. One problem I have now though is that I can't get the textarea to be 100% big. I had to pick a size and just hope it works out ok. I also don't honestly know what a few lines of this code does. :)

0.0.3 I switched the display to use a textarea. This makes it - hopefully - a bit easier to get the code. It also helps preserve tabs. Unfortunately, you can't CTRL+A in the textarea. Not sure why. 


