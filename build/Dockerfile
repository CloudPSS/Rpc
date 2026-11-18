FROM docker.cloudpss.net/cloudpss/buildpack-lts AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends flex m4 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL --retry 3 https://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.xz -o /tmp/bison.tar.xz \
    && echo '9bba0214ccf7f1079c5d59210045227bcf619519840ebfa80cd3849cff5a5bf2  /tmp/bison.tar.xz' | sha256sum -c - \
    && tar -xf /tmp/bison.tar.xz -C /tmp \
    && cd /tmp/bison-3.8.2 \
    && ./configure --prefix=/usr/local \
    && make -j4 \
    && make install \
    && cd / \
    && rm -rf /tmp/bison-3.8.2 /tmp/bison.tar.xz

RUN python3 -m venv /opt/cmake \
    && /opt/cmake/bin/python -m pip install --index-url https://pypi.org/simple \
        --no-cache-dir --only-binary=:all: cmake==3.31.10
ENV PATH="/opt/cmake/bin:${PATH}"

WORKDIR /build
COPY build-thrift.sh .
COPY --from=thrift-source /thrift.tar.gz .
RUN bash ./build-thrift.sh

FROM scratch AS artifact
COPY --from=builder /build/thrift-build/bin/thrift /thrift
