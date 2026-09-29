-- เมนูร้าน cha_lalalala (5 หมวด 20 รายการ)
insert into menu_categories (name, sort_order) values
('ชาไทย', 1), ('ชาเขียว', 2), ('ชาไต้หวัน', 3), ('ชาดำ', 4), ('ชานมเย็น', 5);

insert into menu_items (category_id, name)
select id, item from menu_categories,
  lateral (values
    ('ชาไทยเย็น'), ('ชาไทยร้อน'), ('ชาไทยปั่น'), ('ชาไทยนมสด')
  ) as t(item)
where menu_categories.name = 'ชาไทย'
union all
select id, item from menu_categories,
  lateral (values
    ('ชาเขียวเย็น'), ('ชาเขียวร้อน'), ('ชาเขียวมัทฉะ'), ('ชาเขียวนมสด')
  ) as t(item)
where menu_categories.name = 'ชาเขียว'
union all
select id, item from menu_categories,
  lateral (values
    ('ชาไต้หวันไข่มุก'), ('ชาอู่หลงไต้หวัน'), ('ชาไต้หวันนมสด'), ('ชาไต้หวันบราวน์ชูการ์')
  ) as t(item)
where menu_categories.name = 'ชาไต้หวัน'
union all
select id, item from menu_categories,
  lateral (values
    ('ชาดำเย็น'), ('ชาดำร้อน'), ('ชาดำมะนาว'), ('ชาดำน้ำผึ้งมะนาว')
  ) as t(item)
where menu_categories.name = 'ชาดำ'
union all
select id, item from menu_categories,
  lateral (values
    ('ชานมเย็น'), ('ชานมไข่มุก'), ('ชานมบราวน์ชูการ์'), ('ชานมพุดดิ้ง')
  ) as t(item)
where menu_categories.name = 'ชานมเย็น';
