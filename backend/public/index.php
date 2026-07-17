<?php

// ============================================================
// Entry Point: backend/public/index.php
// 所有請求由 Nginx rewrite 至此
// ============================================================

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

require BASE_PATH . '/vendor/autoload.php';

use Src\Core\App;

$app = new App();
$app->run();
