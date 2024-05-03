FROM python:3.10

RUN useradd -m -U app

WORKDIR /home/app
USER app

COPY . .

USER root
RUN pip install --no-cache-dir -e .

USER app

ENV PYTHONPATH=/home/app

CMD ["python", "-m", "people_directory"]
