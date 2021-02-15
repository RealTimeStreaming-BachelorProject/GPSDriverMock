#/bin/bash

number_of_unique_routes=2

counter=1
for i in {1..3} # 10 clients
do
    if ((counter > number_of_unique_routes)); then
        counter=1 # reset back to route 1
    fi
    docker run -d \
        -e DRIVERUSERNAME=$(cat /dev/random | LC_CTYPE=C tr -dc "[:alpha:]" | head -c 12) \
        -e ROUTENAME="route${counter}" \
        -e DRIVER_SERVICE_URL="ws://192.168.50.65:5002/drivers" \
        -e LOGINSERVICE_URL="http://192.168.50.65:5005" \
        omvk97/bachelorgpsdrivermock

    ((counter=counter+1))
done