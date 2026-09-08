FROM python:3.14

RUN groupadd -g 1000 app && useradd -m -g 1000 -u 1000 app

RUN mkdir /app
WORKDIR /app

COPY pyproject.toml /app/pyproject.toml
COPY README.md /app/README.md
COPY LICENSE /app/LICENSE
COPY people_directory /app/people_directory

RUN chown -R app:app /app

USER app

RUN git config --global --add safe.directory /app

ENV VIRTUAL_ENV=/app/venv

RUN python3 -m venv $VIRTUAL_ENV

ENV PATH="$VIRTUAL_ENV/bin:$PATH"

ARG VERSION
ENV SETUPTOOLS_SCM_PRETEND_VERSION_FOR_PEOPLE_DIRECTORY=$VERSION

RUN --mount=type=bind,source=.git,target=.git,ro pip install --no-cache .

CMD ["python", "-m", "people_directory"]
