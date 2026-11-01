<?php
// Fixed upstream: no user-selected target, credentials or redirects.
declare(strict_types=1);
function failResponse(int $status, string $message): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['blad' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
$uri = $_SERVER['REQUEST_URI'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!str_starts_with($uri, '/api/') || strlen($uri) > 16384 || preg_match('/[\r\n]/', $uri)) failResponse(404, 'Nie znaleziono zasobu.');
if (!in_array($method, ['GET','HEAD','POST','PATCH','PUT','DELETE','OPTIONS'], true)) failResponse(405, 'Niedozwolona metoda.');
if (!function_exists('curl_init')) failResponse(503, 'Połączenie z API nie zostało jeszcze uruchomione.');
$body = file_get_contents('php://input', false, null, 0, 31457281);
if ($body === false || strlen($body) > 31457280 || (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 31457280) failResponse(413, 'Przesłane dane są zbyt duże.');
$headers = ['Accept: application/json, application/pdf'];
foreach (['CONTENT_TYPE'=>'Content-Type','HTTP_ORIGIN'=>'Origin','HTTP_COOKIE'=>'Cookie','HTTP_AUTHORIZATION'=>'Authorization'] as $key=>$name) {
    $value = $_SERVER[$key] ?? '';
    if ($value !== '' && !preg_match('/[\r\n]/', $value)) $headers[] = $name . ': ' . $value;
}
$handle = curl_init('https://api.panstolarz.pro' . $uri);
$responseHeaders = [];
curl_setopt_array($handle, [
    CURLOPT_CUSTOMREQUEST=>$method, CURLOPT_HTTPHEADER=>$headers,
    CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>false,
    CURLOPT_CONNECTTIMEOUT=>8, CURLOPT_TIMEOUT=>60,
    CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
    CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,
    CURLOPT_HEADERFUNCTION=>static function($ch, string $line) use (&$responseHeaders): int {
        if (preg_match('/^HTTP\//', $line)) $responseHeaders=[];
        elseif (str_contains($line, ':')) {
            [$name,$value]=explode(':',$line,2);
            if (in_array(strtolower(trim($name)), ['content-type','content-disposition','set-cookie','retry-after'],true)) $responseHeaders[] = trim($name).': '.trim($value);
        }
        return strlen($line);
    }
]);
if (!in_array($method,['GET','HEAD'],true)) curl_setopt($handle, CURLOPT_POSTFIELDS, $body);
if ($method === 'HEAD') curl_setopt($handle, CURLOPT_NOBODY, true);
$result = curl_exec($handle);
$status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
$failed = $result === false;
curl_close($handle);
// Never redirect to deployment login, relay cookies on redirects or cache private data.
if ($failed || $status < 200 || ($status >= 300 && $status < 400)) failResponse(503, 'API jest chwilowo niedostępne. Spróbuj ponownie później.');
http_response_code($status);
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
foreach ($responseHeaders as $h) header($h, false);
echo $result;
