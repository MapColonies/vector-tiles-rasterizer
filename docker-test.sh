#!/bin/sh

set -e

handle() {
	SIGNAL=$(( $? - 128 ))
	echo "Caught signal ${SIGNAL}, stopping gracefully"
	kill -s ${SIGNAL} $(pidof node) 2>/dev/null
}

trap handle INT TERM

if ! which -- "${1}"; then
    xvfb-run -a --server-args="-screen 0 1024x768x24" -- dumb-init npm run test "$@" &
	wait $! || RETVAL=$?
	wait
	exit ${RETVAL}
fi

exec "$@"
