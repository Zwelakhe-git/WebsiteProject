<?php
require_once 'config/database.php';
function registerUser($username, $email, $password, $access_key) {
    $host = "sql101.infinityfree.com";
    $dbuser = "if0_39722397";
    $dbpass = "pehBevo9Zxfx";
    $db = $dbuser . "_zvelake";
    
    $url = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo = new PDO($url, DB_USER, DB_PASS);
    
    try {
       
        $pdo->beginTransaction();
        
        // Проверяем существование пользователя
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE name = ? OR email = ?");
        $stmt->execute([$username, $email]);
        $user_count = $stmt->fetchColumn();
        
        if ($user_count > 0) {
            $pdo->rollBack();
            
            // Проверяем что именно существует
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE name = ?");
            $stmt->execute([$username]);
            if ($stmt->fetchColumn() > 0) {
                return ["success" => false, "message" => "Username already exists"];
            } else {
                return ["success" => false, "message" => "Email already exists"];
            }
        }
        
        // Вставляем пользователя
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $password_hash]);
        $userid = $pdo->lastInsertId();
        //$stmt->close();
        $likeTable = escapeTableName($username . "_liked_tracks");
        $dwldTable = escapeTableName($username . "_downloaded_tracks");
        
        $sql = "CREATE TABLE $likeTable (id SERIAL PRIMARY KEY, track_id BIGINT(20) UNSIGNED, 
        owner BIGINT(20) UNSIGNED DEFAULT ?,
        FOREIGN KEY (track_id) REFERENCES Music (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (owner) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE INNODB CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";
        $stmt = $pdo->prepare($sql);
        
        $stmt->execute([$userid]);
        
        //$stmt->close();
        $sql = "CREATE TABLE $dwldTable (id SERIAL PRIMARY KEY, track_id BIGINT(20) UNSIGNED, 
        owner BIGINT(20) UNSIGNED DEFAULT ?,
        FOREIGN KEY (track_id) REFERENCES Music (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (owner) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE INNODB CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";
        $stmt = $pdo->prepare($sql);
        
         $stmt->execute([$userid]);
        
        
        $pdo->commit();
        return ["success" => true, "message" => "User registered successfully"];
        
    } catch (PDOException $e) {
        
        return ["success" => false, "message" => "Registration failed: " . $e->getMessage()];
    } catch(Exception $e){
        return ["success" => false, "message" => $e->getMessage()];
    }
}

// для получения как json
// $input = json_decode(file_get_contents('php://input'), true)
if(isset($_POST["login"]) && isset($_POST["password"]) && isset($_POST["email"])){
    $response = registerUser($_POST["login"], $_POST["email"], $_POST["password"]);
    echo json_encode($response);
}
else{
    echo json_encode(["success" => false, "message" => "missing fields"]);
}

function escapeTableName($tname){
    return "`" . str_replace("`", "``", $tname) . "`";
}
?>
