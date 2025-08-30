<?php

$username = "zvelake";
$password = "zvelake@2025";
$host = "localhost";
$db = "zvelake";

$connection = mysqli_connect($host, $username, $password);
if(!$connection){
    die("" . mysqli_connect_error());
}

if(!mysqli_select_db($connection, $db)){
    die("не удалось выбирать базу данных");
}

$resourcesToFetch = [
    [
        "name" => "musicContent",
        "sqlquery" => "SELECT coverImage,videoLocation,description,imageType,videoType FROM VideoContent",
        "result" => []
    ],
    [
        "name" => "services",
        "sqlquery" => "SELECT name,description FROM Services",
        "result" => []
    ],
    [
        "name" => "news",
        "sqlquery" => "SELECT coverImage,imageType,newsDate,newsHeadline,newsContent FROM NewsContent",
        "result" => []
    ],
    [
        "name" => "charts",
        "sqlquery" => "",
        "result" => []
    ]
];


//
header("Content-Type: text/json");
$finalReponse = [];

foreach ($resourcesToFetch as $_ => $resource){
    if($resource["sqlquery"] !== ""){
        $queryResult = mysqli_query($connection, $resource["sqlquery"]);
        if(!$queryResult){
            die("Failed to execute request : " . mysqli_error($connection));
        }
        $i = 0;
        if(mysqli_num_rows($queryResult) > 0){
            while($row = mysqli_fetch_assoc($queryResult)){
                $resource["result"][$i++] = $row;
            }
        }
        $finalReponse[$resource["name"]] = $resource["result"];
    }
}

echo json_encode($finalReponse);
?>