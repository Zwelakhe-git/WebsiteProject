<?php
// webhook.php
//error_reporting(0);
$payload = @file_get_contents('php://input');
$event = json_decode($payload, true);

// Логируем все запросы для отладки
file_put_contents('webhook_debug.txt', 
    date('Y-m-d H:i:s') . " - " . ($event['type'] ?? 'unknown') . "\n" . 
    json_encode($event, JSON_PRETTY_PRINT) . "\n\n", 
    FILE_APPEND
);

if (isset($event['type'])) {
    switch ($event['type']) {
        case 'payment_intent.succeeded':
            handlePaymentSucceeded($event['data']['object']);
            break;
            
        case 'payment_intent.payment_failed':
            handlePaymentFailed($event['data']['object']);
            break;
            
        case 'payment_intent.canceled':
            handlePaymentCanceled($event['data']['object']);
            break;
            
        case 'payment_intent.created':
            handlePaymentCreated($event['data']['object']);
            break;
            
        case 'invoice.payment_succeeded':
            handleInvoicePaymentSucceeded($event['data']['object']);
            break;
            
        default:
            file_put_contents('unhandled_events.txt', 
                date('Y-m-d H:i:s') . " - Unhandled: " . $event['type'] . "\n", 
                FILE_APPEND
            );
    }
}

http_response_code(200);

// Реализации функций обработки...
function handlePaymentSucceeded($paymentIntent) {
    $data = [
        'id' => $paymentIntent['id'],
        'amount' => $paymentIntent['amount'] / 100,
        'currency' => $paymentIntent['currency'],
        'email' => $paymentIntent['receipt_email'] ?? 'unknown',
        'status' => $paymentIntent['status'],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    file_put_contents('successful_payments.txt', 
        json_encode($data, JSON_PRETTY_PRINT) . ",\n", 
        FILE_APPEND
    );
    
    // Активируйте услугу
    activateBroadcastingService($data['email'], $data['id']);
    
    $paymentId = $paymentIntent['id'];
    $customerEmail = $paymentIntent['receipt_email'];
    $amount = $paymentIntent['amount'] / 100;
    
    // Генерация данных для доступа
    $example_email = $customerEmail;
    $email_prefix = substr($example_email, 0, strpos($example_email, '@')) . '_' . substr(uniqid(), 0, 5);
    $unique_access_key = bin2hex(random_bytes(16));
    $unique_password = substr(md5(uniqid()), 0, 8);
    
    // Сохраняем данные в сессию или БД
    session_start();
    $_SESSION['access_data'] = [
        'email' => $example_email,
        'email_prefix' => $email_prefix,
        'access_key' => $unique_access_key,
        'password' => $unique_password,
        'payment_id' => $paymentId
    ];
    
    // Перенаправляем на страницу с формой
    $email_prefix = substr($example_email, 0, strpos($example_email, '@')) . '_' . substr(uniqid(), 0, 5);
    $unique_access_key = bin2hex(random_bytes(16));
    $unique_password = substr(md5(uniqid()), 0, 8);
    $streamdata = [
        "login" => $email_prefix . "_konektem",
        "accessKey" => $unique_access_key,
        "password" => $unique_password
    ];
    echo json_encode($streamdata);
    file_put_contents('successful_create_access.txt', 
        json_encode($streamdata, JSON_PRETTY_PRINT) . ",\n", 
        FILE_APPEND
    );
    
    header('Location: /streamingAccessForm.php');
    exit;
    
}

function handlePaymentCanceled($paymentIntent) {
    $data = [
        'id' => $paymentIntent['id'],
        'reason' => $paymentIntent['cancellation_reason'] ?? 'manual',
        'status' => $paymentIntent['status'],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    file_put_contents('canceled_payments.txt', 
        json_encode($data, JSON_PRETTY_PRINT) . ",\n", 
        FILE_APPEND
    );
    
    // Отмените услугу
    cancelBroadcastingService($data['id']);
}

function handlePaymentCreated($paymentIntent) {
    $data = [
        'id' => $paymentIntent['id'],
        'amount' => $paymentIntent['amount'] / 100,
        'currency' => $paymentIntent['currency'],
        'status' => $paymentIntent['status'],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    file_put_contents('created_payments.txt', 
        json_encode($data, JSON_PRETTY_PRINT) . ",\n", 
        FILE_APPEND
    );
}

function handleInvoicePaymentSucceeded($invoice) {
    // Для подписок
    $data = [
        'id' => $invoice['id'],
        'subscription' => $invoice['subscription'] ?? null,
        'amount_paid' => $invoice['amount_paid'] / 100,
        'customer_email' => $invoice['customer_email'] ?? 'unknown',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    file_put_contents('subscription_payments.txt', 
        json_encode($data, JSON_PRETTY_PRINT) . ",\n", 
        FILE_APPEND
    );
}

// Ваши бизнес-функции
function activateBroadcastingService($email, $paymentId) {
    // Реализуйте активацию услуги вещания
    // Обновите вашу БД
}

function cancelBroadcastingService($paymentId) {
    // Реализуйте отмену услуги
}
?>
