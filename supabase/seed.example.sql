insert into public.subjects(code,name_tr) values
('math','Matematik'),
('turkish','Türkçe'),
('science','Fen Bilimleri'),
('history','T.C. İnkılap Tarihi ve Atatürkçülük'),
('religion','Din Kültürü ve Ahlak Bilgisi'),
('english','İngilizce')
on conflict(code) do nothing;
