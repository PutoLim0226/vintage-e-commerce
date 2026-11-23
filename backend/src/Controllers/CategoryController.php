<?php

declare(strict_types=1);

namespace Src\Controllers;

use Src\Core\BaseController;
use Src\Core\Database;

class CategoryController extends BaseController
{
    // GET /api/categories
    public function index(array $params): void
    {
        $db = Database::getInstance();
        $nameField = $this->getCategoryNameSQL('categories');
        $stmt = $db->query(
            "SELECT id, parent_id, {$nameField} AS name, name AS original_name, name_en, name_zh_cn, slug, description, image_url, sort_order
             FROM categories WHERE is_active = 1 ORDER BY sort_order, name"
        );
        $rows = $stmt->fetchAll();

        // 組成樹狀結構
        $map  = [];
        $tree = [];

        foreach ($rows as $row) {
            $row['children'] = [];
            $map[$row['id']] = $row;
        }

        foreach ($map as $id => $item) {
            if ($item['parent_id'] === null) {
                $tree[] = &$map[$id];
            } else {
                $map[$item['parent_id']]['children'][] = &$map[$id];
            }
        }

        $this->success(array_values($tree));
    }
}
