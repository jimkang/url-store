test:
	node tests/basic-tests.mjs

pushall:
	git push origin main && npm publish --access=public
