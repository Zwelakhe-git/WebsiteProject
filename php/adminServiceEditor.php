<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.5"/>
        <meta charset="utf-8"/>
        <style>
            html, body{
                width : 100%;
                height : 100%;
                font-size : 20px;
            }
            body{
                display : flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            div{
                padding : 10px;
                box-sizing: border-box;
            }
            main{
                width : 80%;
                height : 70%;
                display : grid;
                grid-template-columns: 1fr 2fr;
                padding : 10px;
                border-radius : 15px;
                box-shadow : 0px 10px 15px grey;
            }
            .field{
                display : flex;
                flex-direction: column;
                gap : 10px;
            }
            label{
                padding : 5px;
                font-size : 20px;
            }
            input{
                padding : 10px;
                font-size : 20px;
            }
            input[name="name"]{
                height : 1.12me;
            }
            input[name="description"]{
                min-height : 150px;
                overflow : hidden;
            }
            #controls{
                display : flex;
                flex-direction : row;
                gap : 10px;
            }
            button[name="addButton"]{
                width : 50px;
                height : 50px;
                border : 1px solid white;
                border-radius : 50%;
                background-color: #00ffff;
                font-size : 23px;
                transition : background-color 0.3ms linear, transform 0.3ms linear;
            }
            button[name="addButton"]:hover{
                background-color : #01c2c2;
            }
            button[name="addButton"]:active{
                transform : scale(1.15);
            }
            input[type="reset"]{
                background-color: red;
                color : white;
                border : 1px solid white;
                transition : background-color 0.3ms linear;
                
            }
            input[type="reset"]:hover{
                background-color: #c70101;;
            }
            #left-sect{
                height : 100%;
                padding : 5px;
            }
            #added-services{
                display : flex;
                flex-direction: column;
                gap : 5px;
                height : 90%;
                border-right : 2px solid black;
                overflow : hidden;
            }
            .serviceName{
                border-radius: 15px;
                padding : 10px;
                transition : background-color 0.3ms linear;
            }
            
            .serviceName:hover{
                background-color : #d1cfcf;
            }
            .service-item{
                max-height : 30%;
                overflow : hidden;
                transition : background-color 0.3ms linear;
            }
            .serviceName.selected{
                background-color : #c0bfbf;
            }
            .service-item.selected:hover{
                overflow-y : scroll;
            }
            .service-item.selected{
                border-radius : 15px;
                border : 1.5px solid blue;
            }
            #delete-icon{
                transition : transform 0.3ms linear;
            }
            #delete-icon:active{
                transform : scale(1.15);
            }
            textarea{
                padding : 10px;
            }
        </style>
    </head>
    <body>
        <h1>Services Editor</h1>
        
        <main>
            <div id="left-sect">
                <div id="added-services">
                    <h1>Added Services</h1>
                    <?php
                        // соединение к базе данных, от которого получим данных об услугах
                        $username = "root";
                        $password = "";
                        $host = "localhost";
                        $db = "zvelake";

                        $connection = mysqli_connect($host, $username, $password);
                        if(!$connection){
                            die("" . mysqli_connect_error($connection));
                        }

                        if(!mysqli_select_db($connection, $db)){
                            die("не удалось выбирать базу данных");
                        }

                        $query = "SELECT * FROM Services";
                        $result = mysqli_query($connection, $query);
                        if(!$result){
                            die("не удалось выполнять запрос");
                        }
                        if(mysqli_num_rows($result) > 0){
                            while($ele = mysqli_fetch_array($result)){
                                $name = $ele["name"];
                                $descr = $ele["description"];
                                echo "<div class=\"service-item\">
                                <span class=\"serviceName\">$name</span>
                                <p class=\"serviceDescr\" style=\"display : none;\">$descr</p></div>";
                            }
                        }
                        mysqli_close($connection);
                    ?>
                </div>
                <img id="delete-icon" src="../media/images/delete_02psupe03w7v.svg" width="30" height="30">
            </div>
            <form id="services-editor-form" method="POST" action="/blogsite/php/saveServices.php">
                <div class="field">
                    <label for="sercive-name">Name</label>
                    <input type="text" name="name" id="sercive-name" required/>
                </div>
                <div class="field">
                    <label for="service-description">Description</label>
                    <textarea name="description" value="" id="service-description" placeholder="service description" required></textarea>
                </div>
                <div id="controls">
                    <button type="submit" name="addButton">
                        +
                    </button>
                    <input type="reset" value="CLEAR"/>
                    <!-- icon666.com - MILLIONS OF FREE VECTOR ICONS -->
                </div>
            </form>
        </main>
        <script type="text/javascript" src="/blogsite/JS/adminServicesEditor.js">
        </script>
    </body>
</html>