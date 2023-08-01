test:
	node tests/basic-tests.mjs
	node tests/nested-tests.mjs

pushall:
	git push origin main && npm publish --access=public
