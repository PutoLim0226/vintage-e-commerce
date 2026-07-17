<?php

// ============================================================
// Database: PDO 單例連線
// ============================================================

declare(strict_types=1);

namespace Src\Core;

use PDO;

class Database
{
    private static ?PDO $pdo = null;

    public static function getInstance(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $cfg = require BASE_PATH . '/config/database.php';

        $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['dbname']};charset={$cfg['charset']}";

        self::$pdo = new PDO($dsn, $cfg['username'], $cfg['password'], $cfg['options']);

        return self::$pdo;
    }

    /** 禁止外部實例化與複製 */
    private function __construct() {}
    private function __clone() {}
}
