
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="utf-8" />
        <title>Save Services to DataBase</title>
    </head>
    <body>
        <?php
            error_reporting(0);
            $connection = mysqli_connect("localhost", "zvelake", "zvelake@2025");
            if(!$connection){
                die("Не удалось подключиться к базе данных");
            }
            echo "<p>успешно подключилось к серверу</p><br />";
            if(!mysqli_select_db($connection, "zvelake")){
                die("Не удалось выбирать базу данных");
            }
            
            if(isset($_POST["name"])){
                $name = mysqli_real_escape_string($connection,$_POST["name"]);
                $description = mysqli_real_escape_string($connection,$_POST["description"]);
                $result = mysqli_query($connection,"INSERT INTO Services (name, description)
                    VALUES
                    ('$name','$description')"
                );

                if(!$result){
                    $err_message = date("Y.m.d H.i.s") . " " . mysqli_errno($connection) . " " . mysqli_error($connection) . "\r\n";
                    error_log($err_message, 3, "logs/errLogs.log");
                    die("не удалось выполнить запрос SQL. Проверьте правильность команды");
                }
                echo "<h3>Данные успешно записаны в базу данных</h3><br />";
            }
            mysqli_close($connection);
        ?>
        <input type="button" value="Вернуться" onClick="history.go(-1)"></input>
    </body>
</html>