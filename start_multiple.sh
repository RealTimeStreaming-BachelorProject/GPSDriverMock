#/bin/bash

number_of_unique_routes=2

counter=1
for i in {1..100} # 10 clients
do
    if ((counter > number_of_unique_routes)); then
        counter=1 # reset back to route 1
    fi
    docker run -d \
        -e DRIVERUSERNAME=$(cat /dev/random | LC_CTYPE=C tr -dc "[:alpha:]" | head -c 12) \
        -e ROUTENAME="route${counter}" \
        -e DRIVER_SERVICE_URL="ws://driverservice:5002/drivers" \
        -e LOGINSERVICE_URL="http://loginservice:5005" \
        --network="dev-network" \
        omvk97/bachelorgpsdrivermock

    ((counter=counter+1))
done