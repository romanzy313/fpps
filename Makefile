# Nothing to see here
# This makefile is used to publish the applications


.PHONY: docker-dev
docker-dev:
	docker build --progress plain -t file-transfer-dev .
	docker run -e PORT=6173 -p 6173:6173 file-transfer-dev

IMAGE ?= freeappnet/file-transfer
.PHONY: docker-publish
docker-publish:
	pnpm test
	@if [ -z "$(TAGNAME)" ]; then \
		echo "ERROR: TAGNAME is required. e.g. make docker-publish TAGNAME=v1.2.3"; \
		exit 1; \
	fi
	docker build -t $(IMAGE):$(TAGNAME) .
	docker push $(IMAGE):$(TAGNAME)
