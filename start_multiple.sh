#/bin/bash

number_of_unique_routes=2

counter=1
for i in {1..2} # 10 clients
do
    if ((counter > number_of_unique_routes)); then
        counter=1 # reset back to route 1
    fi
    docker run -d -e ROUTENAME="route${counter}" -e DRIVER_SERVICE_URL="ws://192.168.50.65:5001/drivers" omvk97/bachelorgpsdrivermock
    ((counter=counter+1))
done