# url-store

Gets, sets, and syncs state from the URL hash and an internal dictionary. Calls your callback when it changes.

This is a way of keeping as much of your app state in the URL hash as possible, while keeping your app in sync with it and the other way around.

This is an ES modules version of [route-state](https://github.com/jimkang/route-state).

# Installation

    npm install @jimkang/url-store

# Usage

    import { URLStore } from 'url-store';

    var urlStore = URLStore({
      onUpdate,
      defaults: {
        flying: true
      },
      windowObject: window
    });

    wireGetAudioUI({useURI: addTrackURIToRoute});
    urlStore.update();

    function addTrackURIToRoute(uri) {
      urlStore.update({trackURI: uri});
    }

    function onUpdate(state, ephemeralState) {
      if (state.remix && state.trackURI) {
    	runRandomClipFlow(state.trackURI);
      }
      else if (state.trackURI) {
       runSampleFlow(state.trackURI);
      }

      if (ephemeralState.buffer) {
        // Play buffer or something
      }
    }

The `updateEphemeral` method is like `update` except it does not update (or draw from) the hash. It's ideal for storing too-large things like buffers.

You can pass an array in `boolKeys` in the constructor to have it convert properties with values like 'yes' or 'no' to boolean `true` and `false` when parsing from the hash and converting `true` and `false` in the in-memory state to 'yes and 'no' when writing back to the hash.

You can do the same with `jsonKeys` to have it parse/stringify key values as JSON. (The value will look really ugly in the hash, though.)

There is also a `moveSearchToHash` that'll take things from the search string in the URL (the part after the `?`) and put it in the hash (after the `#`).

You can set the state with nested objects, but it's not advised because the verboseness of [nested object hash serialization](https://www.npmjs.com/package/qs#parsing-objects). (There are alternatives to that, but they're also ugly.)

# Tests

Run tests with `make test`.

# License

The MIT License (MIT)

Copyright (c) 2023 Jim Kang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
