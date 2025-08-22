FROM python:3.10

COPY tools/script.sh /bin/script.sh

RUN apt-get -y update

RUN apt-get -y install postgresql-client

RUN pip install --upgrade pip 

WORKDIR /code

COPY ./src/ .

# RUN groupadd -r transgroup && useradd -r -g transgroup leader

# RUN chown -R leader:transgroup /code

# USER leader

# ENV HOME=/code 


RUN pip install -r requirements.txt


EXPOSE 8000

# CMD ["python", "src/manage.py", "runserver", "0.0.0.0:8000"]
CMD ["bash", "/bin/script.sh"]
