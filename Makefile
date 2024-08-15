test:
	node tests/basic-tests.mjs
	node tests/nested-tests.mjs
	node tests/encoder-tests.mjs

pushall:
	git push origin main && npm publish --access=public
