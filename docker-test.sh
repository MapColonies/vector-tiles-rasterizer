#!/bin/bash

_term() {
	echo "Caught signal, stopping gracefully"
	kill -TERM "$child" 2>/dev/null
}

trap _term SIGTERM
trap _term SIGINT

xvfbMaxStartWaitTime=10
displayNumber=99
screenNumber=0

echo "Starting Xvfb on display ${displayNumber}"
start-stop-daemon --start --pidfile ~/xvfb.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :${displayNumber} -screen ${screenNumber} 1920x1080x24 -ac +extension GLX +render -noreset

# Wait to be able to connect to the port. This will exit if it cannot in 1 minute.
timeout ${xvfbMaxStartWaitTime} bash -c "while  ! xdpyinfo -display :${displayNumber} >/dev/null; do sleep 0.5; done"
if [ $? -ne 0 ]; then
  echo "Could not connect to display ${displayNumber} in ${xvfbMaxStartWaitTime} seconds time."
  exit 1
fi

export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu
export DISPLAY=:${displayNumber}.${screenNumber}

echo
dumb-init npm run test "$@" &
child=$!
wait "$child"

start-stop-daemon --stop --retry 5 --pidfile ~/xvfb.pid # stop xvfb when exiting
rm ~/xvfb.pid
