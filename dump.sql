--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status AS ENUM (
    '未着手',
    '作業中',
    '私がやる予定',
    '完了',
    'アーカイブ'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users_sync; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.users_sync (
    raw_json jsonb NOT NULL,
    id text GENERATED ALWAYS AS ((raw_json ->> 'id'::text)) STORED NOT NULL,
    name text GENERATED ALWAYS AS ((raw_json ->> 'display_name'::text)) STORED,
    email text GENERATED ALWAYS AS ((raw_json ->> 'primary_email'::text)) STORED,
    created_at timestamp with time zone GENERATED ALWAYS AS (to_timestamp((trunc((((raw_json ->> 'signed_up_at_millis'::text))::bigint)::double precision) / (1000)::double precision))) STORED,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    task_id uuid NOT NULL,
    user_name character varying(100),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: task_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    list_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status public.status DEFAULT '未着手'::public.status NOT NULL,
    assigned_to character varying(100),
    completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    progress_percentage integer DEFAULT 0
);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Data for Name: users_sync; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.users_sync (raw_json, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, task_id, user_name, content, created_at) FROM stdin;
1	cf912c3f-4e8b-4bf5-9092-d07be703291d	匿名	eee	2025-05-19 17:37:35.04821+00
2	cf912c3f-4e8b-4bf5-9092-d07be703291d	そ	っっd	2025-05-19 17:37:44.344704+00
3	9e3410db-bd76-4921-ab99-702315752902	匿名	っw	2025-05-19 17:44:22.569259+00
4	5e80031d-67d5-48dd-8977-e48623f0bb42	そうし	おりゃおりゃ	2025-05-20 04:16:22.467312+00
5	65d599b3-6c7f-4b33-b4d8-2bf21b206cdb	匿名	sss	2025-05-22 13:53:12.243841+00
\.


--
-- Data for Name: task_lists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_lists (id, title, description, created_at, updated_at) FROM stdin;
76aaae94-7de1-44bb-8b3d-86d3a75489bf	s	s	2025-05-19 17:32:37.192707+00	2025-05-19 17:32:37.192707+00
316a010e-634c-408c-8307-3a4260aaf7ac	ee	ee	2025-05-19 17:37:22.918612+00	2025-05-19 17:37:22.918612+00
af7d2fc0-09b3-40f2-ba53-51ae7f4bf98e	ああ	あああ	2025-05-19 17:43:13.232561+00	2025-05-19 17:43:13.232561+00
c8094bcf-7156-48a7-9b7a-dcb54c7c9294	ss	ss	2025-05-19 18:04:58.151052+00	2025-05-19 18:04:58.151052+00
f8cb564e-ee6b-4133-83c5-544ffce6fafc	ss	dd	2025-05-19 18:11:03.445941+00	2025-05-19 18:11:03.445941+00
86717e30-4b93-4e58-bf8b-792a685c887d	ああ	ああ	2025-05-19 18:17:55.012464+00	2025-05-19 18:17:55.012464+00
ef97bb90-a0fe-4ee4-8c40-b467f04054ac	Ch	Hh	2025-05-19 18:27:18.10748+00	2025-05-19 18:27:18.10748+00
081e8271-c786-4910-b871-97eb9d6cc3ec	CI’m 		2025-05-19 18:28:57.438495+00	2025-05-19 18:28:57.438495+00
e8065095-bda4-4042-ab49-1d4691902848	ds	っd	2025-05-19 18:32:57.566937+00	2025-05-19 18:32:57.566937+00
6797b027-2ff7-4de5-9bd3-4a136649d600	っs	っs	2025-05-19 18:39:19.965659+00	2025-05-19 18:39:19.965659+00
6a1905a9-249b-4a1c-8593-bab56dd4bd25	っd		2025-05-20 03:53:12.936677+00	2025-05-20 03:53:12.936677+00
af55f658-2f4a-4546-9847-0ed595d1cf2c	s		2025-05-20 03:58:43.661986+00	2025-05-20 03:58:43.661986+00
8283e149-b3b2-41e7-a684-fdee33aad1ef	s		2025-05-20 03:59:47.637762+00	2025-05-20 03:59:47.637762+00
671b67ec-b455-4f94-83fe-2c6f058d5835	ss		2025-05-20 04:05:17.677371+00	2025-05-20 04:05:17.677371+00
89f9e42b-7959-4784-8b6d-76c60d112e57	s		2025-05-20 04:14:03.517518+00	2025-05-20 04:14:03.517518+00
d705bf91-7ed9-4a9b-9552-d41e210671a0	s		2025-05-20 04:24:02.833816+00	2025-05-20 04:24:02.833816+00
5571aba8-8fb0-41ad-a009-e075330e1347	test		2025-05-20 07:05:36.823166+00	2025-05-20 07:05:36.823166+00
52e02297-402d-49d1-9668-814c415ed920	あ		2025-05-20 07:15:11.372825+00	2025-05-20 07:15:11.372825+00
c5be166c-d1e4-4a91-a47e-fe94d5e9149c	1		2025-05-20 07:20:04.142532+00	2025-05-20 07:20:04.142532+00
920c8cf0-09e1-406c-9d4e-0128029a526a	っs	d	2025-05-20 07:28:20.95004+00	2025-05-20 07:28:20.95004+00
c8e7d9c8-cfba-4edd-b79c-56e82aa2c3c7	11		2025-05-20 07:33:40.688498+00	2025-05-20 07:33:40.688498+00
666250df-4620-4fcc-a11b-60a870af06c0	d		2025-05-20 07:34:46.56279+00	2025-05-20 07:34:46.56279+00
b0f8e961-ddb8-4bda-a6d8-36050a03b961	ed		2025-05-20 07:36:47.988765+00	2025-05-20 07:36:47.988765+00
8cdefd5f-bdc7-4b96-a90b-60399c5498d0	1		2025-05-20 07:38:51.124021+00	2025-05-20 07:38:51.124021+00
61f5f574-318c-4454-86c4-73cb75669d58	1	てsと	2025-05-20 07:45:05.990107+00	2025-05-20 07:51:12.131+00
58593403-7d8b-4a11-b41b-b4f295d1a719	3e4rtyui		2025-05-20 08:49:06.779011+00	2025-05-20 08:49:06.779011+00
d996fedc-dafd-49f2-b4a0-230d45244700	1243		2025-05-20 09:03:39.047522+00	2025-05-20 09:03:39.047522+00
5ef0d9ba-eec4-4815-935d-0155239fc368	selene		2025-05-21 03:25:56.823831+00	2025-05-21 03:25:56.823831+00
d4a5a8cd-d612-4253-9b6d-ced84051a4cc	dd		2025-05-21 03:27:47.128673+00	2025-05-21 03:27:47.128673+00
ef15e4b3-ee61-401e-8d4f-5048d76a8f0a	f		2025-05-21 03:28:52.513534+00	2025-05-21 03:28:52.513534+00
c3c999b0-73d1-4d62-859c-ca50a287b497	d		2025-05-21 03:29:21.892001+00	2025-05-21 03:29:21.892001+00
95d03891-7ce8-4ada-94c6-bdfc3186a501	d		2025-05-21 03:29:52.830552+00	2025-05-21 03:29:52.830552+00
c2722348-91c1-4269-b4f0-93e2c15613f0	s		2025-05-21 04:30:49.521148+00	2025-05-21 04:30:49.521148+00
011c7994-4a3f-4999-8f95-d36caef2fab6	s		2025-05-21 04:30:52.245587+00	2025-05-21 04:30:52.245587+00
d13b6e13-6ca3-4207-ad78-757086206e5e	d		2025-05-21 04:56:52.662074+00	2025-05-21 04:56:52.662074+00
7d29996d-5988-4465-a252-711e30bffeed	1		2025-05-22 13:09:00.059178+00	2025-05-22 13:09:00.059178+00
17fda790-2155-4ff6-9f81-cf55ec897903	d		2025-05-22 13:09:27.184453+00	2025-05-22 13:09:27.184453+00
b86e4784-67f4-4561-abd9-c40a889eead6	テスト		2025-05-22 13:35:48.954499+00	2025-05-22 13:35:48.954499+00
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, list_id, title, description, status, assigned_to, completed, created_at, updated_at, progress_percentage) FROM stdin;
f70f09c3-3b6d-4291-bf89-cd4401ee02a8	b0f8e961-ddb8-4bda-a6d8-36050a03b961	dd		未着手	匿名	f	2025-05-20 07:36:48.238134+00	2025-05-20 08:04:41.737+00	0
0995914e-63f8-437f-a589-41ee0b3fe091	b0f8e961-ddb8-4bda-a6d8-36050a03b961	s	df	未着手		f	2025-05-20 08:04:52.799342+00	2025-05-20 08:04:52.799342+00	0
25562fd9-3542-4dde-8267-1d9d93cb2b5f	58593403-7d8b-4a11-b41b-b4f295d1a719	fghnm		未着手		f	2025-05-20 08:49:07.0349+00	2025-05-20 08:49:07.0349+00	0
fd2465b7-c008-4633-8a6e-fe1e5d50a1c5	76aaae94-7de1-44bb-8b3d-86d3a75489bf	s	s	作業中		t	2025-05-19 17:32:37.407443+00	2025-05-19 17:33:07.245+00	0
951ead45-be2d-4e81-be91-d22a2d15b57d	58593403-7d8b-4a11-b41b-b4f295d1a719	vbnm		未着手	匿名	f	2025-05-20 08:49:07.291431+00	2025-05-20 09:02:56.272+00	30
67c10b34-330a-48b5-9283-3207f269d750	d996fedc-dafd-49f2-b4a0-230d45244700	8765re		未着手		f	2025-05-20 09:03:39.646204+00	2025-05-20 09:03:39.646204+00	0
cf912c3f-4e8b-4bf5-9092-d07be703291d	316a010e-634c-408c-8307-3a4260aaf7ac	e	e	アーカイブ	そ	f	2025-05-19 17:37:23.155448+00	2025-05-19 17:38:48.495+00	0
dfb4d05e-90b4-4f50-87c7-71d236593772	d996fedc-dafd-49f2-b4a0-230d45244700	98765e		未着手	っっp	t	2025-05-20 09:03:39.302799+00	2025-05-20 09:04:14.246+00	100
9e3410db-bd76-4921-ab99-702315752902	af7d2fc0-09b3-40f2-ba53-51ae7f4bf98e	いいい	いいい	未着手	匿名	f	2025-05-19 17:43:13.448713+00	2025-05-19 17:44:16.638+00	0
0dc749d5-c359-4f47-91c4-df2962918adb	c8094bcf-7156-48a7-9b7a-dcb54c7c9294	ねえ	ええ	未着手		f	2025-05-19 18:05:25.744372+00	2025-05-19 18:05:25.744372+00	0
ac16e0dc-45a3-4b4c-a309-157f815a3c5f	d996fedc-dafd-49f2-b4a0-230d45244700	ghjm,.	k/lmn	完了	匿名	f	2025-05-20 09:03:53.766668+00	2025-05-20 09:04:34.598+00	0
45074252-50c3-4710-ac56-54e269039998	c8094bcf-7156-48a7-9b7a-dcb54c7c9294	ss	ss	私がやる予定	そうし	f	2025-05-19 18:04:58.482732+00	2025-05-19 18:05:46.206+00	0
9ee747ef-ca2c-4437-b6fd-2bcd9b10032d	f8cb564e-ee6b-4133-83c5-544ffce6fafc	cc	cc	未着手		f	2025-05-19 18:12:06.414443+00	2025-05-19 18:12:06.414443+00	0
31baf1b1-3705-44cd-bb34-9f14363fcb56	5ef0d9ba-eec4-4815-935d-0155239fc368	再build		未着手		f	2025-05-21 03:25:56.965366+00	2025-05-21 03:25:56.965366+00	0
331fa737-ee27-454a-b72e-0444f5fc356a	f8cb564e-ee6b-4133-83c5-544ffce6fafc	ddd	dd	アーカイブ	そうし	f	2025-05-19 18:11:03.673691+00	2025-05-19 18:12:30.575+00	0
fe2078ae-9000-4d2f-8482-1310f494486a	86717e30-4b93-4e58-bf8b-792a685c887d	テスト	ああ	作業中	匿名	f	2025-05-19 18:17:55.294348+00	2025-05-19 18:20:52.671+00	0
32778767-0755-4908-93f2-fed09b8518dd	ef97bb90-a0fe-4ee4-8c40-b467f04054ac	あ	な	作業中	匿名	f	2025-05-19 18:27:18.610168+00	2025-05-19 18:27:31.407+00	0
c02dbcfb-3bc2-4270-96d1-1a44e4eb0f81	081e8271-c786-4910-b871-97eb9d6cc3ec	G	H	未着手		f	2025-05-19 18:28:57.856479+00	2025-05-19 18:28:57.856479+00	0
fef0982f-a110-4a3e-b8b1-f7103ae94bdc	d4a5a8cd-d612-4253-9b6d-ced84051a4cc	ss		未着手		f	2025-05-21 03:27:47.802945+00	2025-05-21 03:27:47.802945+00	0
19445dda-1f80-408f-a057-bfe3d4b09e9e	671b67ec-b455-4f94-83fe-2c6f058d5835	dd		作業中	そうし	t	2025-05-20 04:05:17.975711+00	2025-05-20 04:23:30.435+00	10
b37cec87-3259-490b-8862-45319c5914e6	ef15e4b3-ee61-401e-8d4f-5048d76a8f0a	g		未着手		f	2025-05-21 03:28:52.725305+00	2025-05-21 03:28:52.725305+00	0
65b4ba7e-be5a-4594-a890-f523c0779366	c3c999b0-73d1-4d62-859c-ca50a287b497	d		未着手		f	2025-05-21 03:29:22.143034+00	2025-05-21 03:29:22.143034+00	0
5b090584-e1ab-428c-be51-8ed320794080	5571aba8-8fb0-41ad-a009-e075330e1347	test1		作業中	壮志	f	2025-05-20 07:05:37.080223+00	2025-05-20 07:09:24.736+00	70
5c538277-20f5-4510-8ebf-5758b8652b5a	52e02297-402d-49d1-9668-814c415ed920	d	っっd	未着手		f	2025-05-20 07:15:11.602758+00	2025-05-20 07:15:11.602758+00	0
7056cd3f-5860-4196-898f-75a6d2d5e781	c5be166c-d1e4-4a91-a47e-fe94d5e9149c	2	222	未着手		f	2025-05-20 07:20:04.437302+00	2025-05-20 07:20:04.437302+00	0
ac6d5085-c8ac-4085-afbf-f2b4673773b6	c5be166c-d1e4-4a91-a47e-fe94d5e9149c	3	333	未着手		f	2025-05-20 07:20:04.740304+00	2025-05-20 07:20:04.740304+00	0
4717a8f9-8be7-48aa-b906-915e7352cf6a	920c8cf0-09e1-406c-9d4e-0128029a526a	っsっd		未着手		f	2025-05-20 07:28:21.467329+00	2025-05-20 07:28:21.467329+00	0
d46cb627-3272-406b-abfc-1b1df51bf075	95d03891-7ce8-4ada-94c6-bdfc3186a501	s		未着手		f	2025-05-21 03:29:52.886972+00	2025-05-21 03:29:52.886972+00	0
13650d6f-c290-439f-ad01-8a22220d9622	e8065095-bda4-4042-ab49-1d4691902848	d	d	未着手	匿名っk	f	2025-05-19 18:32:57.7938+00	2025-05-19 18:35:07.235+00	0
3a6f7fa4-88aa-4c17-b1fa-4a7b82e6f08b	c2722348-91c1-4269-b4f0-93e2c15613f0	d		未着手		f	2025-05-21 04:30:50.314291+00	2025-05-21 04:30:50.314291+00	0
a9dddb88-f195-4572-9dfe-4ecefbaeb901	011c7994-4a3f-4999-8f95-d36caef2fab6	d		未着手		f	2025-05-21 04:30:52.480531+00	2025-05-21 04:30:52.480531+00	0
251a1b38-4132-457d-86e6-253e5f58dbdf	920c8cf0-09e1-406c-9d4e-0128029a526a	っd	一郎	作業中	そうし	f	2025-05-20 07:28:21.212526+00	2025-05-20 07:31:33.158+00	35
7dbef49f-7575-40fc-85f1-60e4369116f0	c8e7d9c8-cfba-4edd-b79c-56e82aa2c3c7	22		未着手		f	2025-05-20 07:33:40.903439+00	2025-05-20 07:33:40.903439+00	0
a81ec6b0-fdbb-46e2-8b75-ff66206b0cfc	c8e7d9c8-cfba-4edd-b79c-56e82aa2c3c7	333		未着手		f	2025-05-20 07:33:41.205838+00	2025-05-20 07:33:41.205838+00	0
36b7d43c-2485-4630-8cb2-f0b47c981177	6797b027-2ff7-4de5-9bd3-4a136649d600	っs	っs	完了	匿名	f	2025-05-19 18:39:20.208614+00	2025-05-19 18:49:11.071+00	0
fa021fb6-a09b-470a-8fe7-ab5e01157d08	666250df-4620-4fcc-a11b-60a870af06c0	ds		未着手		f	2025-05-20 07:34:46.817869+00	2025-05-20 07:34:46.817869+00	0
10230ddd-cd3d-4343-a077-a5a578bae577	666250df-4620-4fcc-a11b-60a870af06c0	df		未着手		f	2025-05-20 07:34:47.034774+00	2025-05-20 07:34:47.034774+00	0
b8a29880-1836-4cab-9f33-d69f7e0ec41b	6797b027-2ff7-4de5-9bd3-4a136649d600	task1	っx	作業中	匿名	t	2025-05-19 18:48:40.236886+00	2025-05-19 18:49:22.959+00	0
6452eb2d-7abb-4ae0-a171-5e4ea6473826	6a1905a9-249b-4a1c-8593-bab56dd4bd25	d		未着手		f	2025-05-20 03:53:13.630801+00	2025-05-20 03:53:13.630801+00	0
b1a4ad8c-cebf-4f38-bf5d-990327b622dc	6a1905a9-249b-4a1c-8593-bab56dd4bd25	d		私がやる予定	匿名	f	2025-05-20 03:53:13.288819+00	2025-05-20 03:53:33.218+00	0
b2de9af8-633a-45ba-99f4-8421a86fc01e	8283e149-b3b2-41e7-a684-fdee33aad1ef	s２		未着手		f	2025-05-20 03:59:48.321088+00	2025-05-20 03:59:48.321088+00	0
7aaaf07a-0add-444b-9d88-0a6703e1b5fd	8283e149-b3b2-41e7-a684-fdee33aad1ef	s		作業中	そうし	t	2025-05-20 03:59:47.983235+00	2025-05-20 04:00:56.614+00	20
5e80031d-67d5-48dd-8977-e48623f0bb42	671b67ec-b455-4f94-83fe-2c6f058d5835	ss		作業中	そうし	f	2025-05-20 04:06:02.147346+00	2025-05-20 04:23:34.387+00	55
2a510917-6869-450b-bd77-ee0d1f0f72ce	89f9e42b-7959-4784-8b6d-76c60d112e57	d		未着手		f	2025-05-20 04:14:03.934285+00	2025-05-20 04:14:03.934285+00	0
9f4d6b88-a69a-446d-8150-e6d1d14c67e2	d705bf91-7ed9-4a9b-9552-d41e210671a0	d		未着手		f	2025-05-20 04:24:03.820889+00	2025-05-20 04:24:03.820889+00	0
f17af099-0804-4341-a34f-fdc668a3cd53	d705bf91-7ed9-4a9b-9552-d41e210671a0	っs	っd	未着手		f	2025-05-20 04:27:26.310486+00	2025-05-20 04:27:26.310486+00	0
6ce03a5b-f541-4c38-8d66-9aa859cb6deb	5571aba8-8fb0-41ad-a009-e075330e1347	test12		未着手		f	2025-05-20 07:05:37.33858+00	2025-05-20 07:05:37.33858+00	0
a53ec33b-3e84-4d6f-a3fa-8f88748f8258	8cdefd5f-bdc7-4b96-a90b-60399c5498d0	2		未着手		f	2025-05-20 07:38:51.422445+00	2025-05-20 07:38:51.422445+00	0
594bce3a-ba55-4fc9-8d4b-045912007706	8cdefd5f-bdc7-4b96-a90b-60399c5498d0	3		未着手		f	2025-05-20 07:38:51.699465+00	2025-05-20 07:38:51.699465+00	0
7c544122-afa6-44ae-9ca5-8bc4cbf0f02d	61f5f574-318c-4454-86c4-73cb75669d58	3		未着手		f	2025-05-20 07:45:06.618665+00	2025-05-20 07:45:06.618665+00	0
7b824e77-4d67-49a5-bf33-fa4d20cc1d3b	d13b6e13-6ca3-4207-ad78-757086206e5e	f		未着手		f	2025-05-21 04:56:55.700494+00	2025-05-21 04:56:55.700494+00	0
b7d6e078-5680-43ce-a357-be61656a9424	7d29996d-5988-4465-a252-711e30bffeed	3		未着手		f	2025-05-22 13:09:01.331593+00	2025-05-22 13:09:01.331593+00	0
a0ff4f6f-c52a-4f66-8617-99f7fb2dd57b	17fda790-2155-4ff6-9f81-cf55ec897903	d		未着手		f	2025-05-22 13:09:27.549482+00	2025-05-22 13:09:27.549482+00	0
91603bd2-719c-4b37-b29a-26c48beb3e7a	7d29996d-5988-4465-a252-711e30bffeed	2		私がやる予定	匿名	f	2025-05-22 13:09:01.031086+00	2025-05-22 13:19:24.124+00	0
f5bd01ff-72f1-4ea7-b2db-d2ee1f9b8c8a	61f5f574-318c-4454-86c4-73cb75669d58	2		未着手	匿名	f	2025-05-20 07:45:06.22871+00	2025-05-20 07:46:18.373+00	0
65d599b3-6c7f-4b33-b4d8-2bf21b206cdb	b86e4784-67f4-4561-abd9-c40a889eead6	aa		未着手		f	2025-05-22 13:35:49.026613+00	2025-05-22 13:35:49.026613+00	0
\.


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 5, true);


--
-- Name: users_sync users_sync_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.users_sync
    ADD CONSTRAINT users_sync_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: task_lists task_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_lists
    ADD CONSTRAINT task_lists_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users_sync_deleted_at_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX users_sync_deleted_at_idx ON neon_auth.users_sync USING btree (deleted_at);


--
-- Name: comments comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.task_lists(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

