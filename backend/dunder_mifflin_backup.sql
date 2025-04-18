PGDMP                 	        }         
   dunderdata    14.15 (Homebrew)    14.15 (Homebrew) �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                        0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    17248 
   dunderdata    DATABASE     U   CREATE DATABASE dunderdata WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C';
    DROP DATABASE dunderdata;
                postgres    false            �            1255    17566    update_timestamp()    FUNCTION     �   CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.date_updated = NOW();
    RETURN NEW;
END;
$$;
 )   DROP FUNCTION public.update_timestamp();
       public          postgres    false            �            1259    17398    accounts    TABLE     R  CREATE TABLE public.accounts (
    account_id integer NOT NULL,
    business_name character varying(100),
    contact_name character varying(100),
    phone_number character varying(20),
    email character varying(100),
    address character varying(255),
    city character varying(30),
    state character varying(2),
    zip_code character varying(10),
    industry_id integer,
    sales_user_id integer,
    notes text,
    date_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id integer
);
    DROP TABLE public.accounts;
       public         heap    postgres    false            �            1259    17397    accounts_account_id_seq    SEQUENCE     �   CREATE SEQUENCE public.accounts_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.accounts_account_id_seq;
       public          postgres    false    223                       0    0    accounts_account_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.accounts_account_id_seq OWNED BY public.accounts.account_id;
          public          postgres    false    222            �            1259    17570    branches    TABLE     "  CREATE TABLE public.branches (
    branch_id integer NOT NULL,
    branch_name character varying(100) NOT NULL,
    address character varying(255),
    city character varying(50),
    state character varying(2),
    zip_code character varying(10),
    phone_number character varying(20)
);
    DROP TABLE public.branches;
       public         heap    postgres    false            �            1259    17569    branches_branch_id_seq    SEQUENCE     �   CREATE SEQUENCE public.branches_branch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.branches_branch_id_seq;
       public          postgres    false    237                       0    0    branches_branch_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.branches_branch_id_seq OWNED BY public.branches.branch_id;
          public          postgres    false    236            �            1259    17529    calendar_events    TABLE     �  CREATE TABLE public.calendar_events (
    event_id integer NOT NULL,
    event_title character varying(255) NOT NULL,
    location character varying(255),
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    notes text,
    account_id integer,
    user_id integer,
    contact_name character varying(100),
    phone_number character varying(20)
);
 #   DROP TABLE public.calendar_events;
       public         heap    postgres    false            �            1259    17528    calendar_events_event_id_seq    SEQUENCE     �   CREATE SEQUENCE public.calendar_events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.calendar_events_event_id_seq;
       public          postgres    false    233                       0    0    calendar_events_event_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.calendar_events_event_id_seq OWNED BY public.calendar_events.event_id;
          public          postgres    false    232            �            1259    17548    commissions    TABLE     '  CREATE TABLE public.commissions (
    commission_id integer NOT NULL,
    user_id integer,
    invoice_id integer,
    commission_rate numeric,
    commission_amount numeric,
    date_paid timestamp without time zone,
    employee_commission_rate numeric,
    service_commission_rate numeric
);
    DROP TABLE public.commissions;
       public         heap    postgres    false            �            1259    17547    commissions_commission_id_seq    SEQUENCE     �   CREATE SEQUENCE public.commissions_commission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.commissions_commission_id_seq;
       public          postgres    false    235                       0    0    commissions_commission_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.commissions_commission_id_seq OWNED BY public.commissions.commission_id;
          public          postgres    false    234            �            1259    17259    departments    TABLE     s   CREATE TABLE public.departments (
    department_id integer NOT NULL,
    department_name character varying(50)
);
    DROP TABLE public.departments;
       public         heap    postgres    false            �            1259    17258    departments_department_id_seq    SEQUENCE     �   CREATE SEQUENCE public.departments_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.departments_department_id_seq;
       public          postgres    false    212                       0    0    departments_department_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;
          public          postgres    false    211            �            1259    17266 
   industries    TABLE     o   CREATE TABLE public.industries (
    industry_id integer NOT NULL,
    industry_name character varying(100)
);
    DROP TABLE public.industries;
       public         heap    postgres    false            �            1259    17265    industries_industry_id_seq    SEQUENCE     �   CREATE SEQUENCE public.industries_industry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.industries_industry_id_seq;
       public          postgres    false    214                       0    0    industries_industry_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.industries_industry_id_seq OWNED BY public.industries.industry_id;
          public          postgres    false    213            �            1259    17454    invoice_services    TABLE     �   CREATE TABLE public.invoice_services (
    invoice_service_id integer NOT NULL,
    invoice_id integer,
    service_id integer,
    quantity integer,
    price numeric,
    total_price numeric
);
 $   DROP TABLE public.invoice_services;
       public         heap    postgres    false            �            1259    17453 '   invoice_services_invoice_service_id_seq    SEQUENCE     �   CREATE SEQUENCE public.invoice_services_invoice_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 >   DROP SEQUENCE public.invoice_services_invoice_service_id_seq;
       public          postgres    false    227            	           0    0 '   invoice_services_invoice_service_id_seq    SEQUENCE OWNED BY     s   ALTER SEQUENCE public.invoice_services_invoice_service_id_seq OWNED BY public.invoice_services.invoice_service_id;
          public          postgres    false    226            �            1259    17428    invoices    TABLE     �  CREATE TABLE public.invoices (
    invoice_id integer NOT NULL,
    account_id integer,
    service character varying(100),
    amount numeric,
    tax_rate numeric,
    tax_amount numeric,
    discount_percent numeric,
    discount_amount numeric,
    final_total numeric,
    status character varying(20),
    paid boolean,
    payment_method character varying(30),
    last_four_payment_method numeric,
    total_paid numeric,
    date_paid timestamp without time zone,
    notes text,
    date_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_method_id integer,
    sales_user_id integer,
    commission_amount numeric,
    due_date date
);
    DROP TABLE public.invoices;
       public         heap    postgres    false            �            1259    17427    invoices_invoice_id_seq    SEQUENCE     �   CREATE SEQUENCE public.invoices_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.invoices_invoice_id_seq;
       public          postgres    false    225            
           0    0    invoices_invoice_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.invoices_invoice_id_seq OWNED BY public.invoices.invoice_id;
          public          postgres    false    224            �            1259    17504    notes    TABLE     �   CREATE TABLE public.notes (
    note_id integer NOT NULL,
    account_id integer,
    invoice_id integer,
    user_id integer,
    note_text text NOT NULL,
    date_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.notes;
       public         heap    postgres    false            �            1259    17503    notes_note_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notes_note_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.notes_note_id_seq;
       public          postgres    false    231                       0    0    notes_note_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.notes_note_id_seq OWNED BY public.notes.note_id;
          public          postgres    false    230            �            1259    17282    payment_methods    TABLE     o   CREATE TABLE public.payment_methods (
    method_id integer NOT NULL,
    method_name character varying(50)
);
 #   DROP TABLE public.payment_methods;
       public         heap    postgres    false            �            1259    17281    payment_methods_method_id_seq    SEQUENCE     �   CREATE SEQUENCE public.payment_methods_method_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.payment_methods_method_id_seq;
       public          postgres    false    216                       0    0    payment_methods_method_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.payment_methods_method_id_seq OWNED BY public.payment_methods.method_id;
          public          postgres    false    215            �            1259    17289    services    TABLE     �   CREATE TABLE public.services (
    service_id integer NOT NULL,
    service_name character varying(50),
    price numeric,
    discount numeric,
    service_commission_rate numeric,
    discount_percent numeric
);
    DROP TABLE public.services;
       public         heap    postgres    false            �            1259    17288    services_service_id_seq    SEQUENCE     �   CREATE SEQUENCE public.services_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.services_service_id_seq;
       public          postgres    false    218                       0    0    services_service_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.services_service_id_seq OWNED BY public.services.service_id;
          public          postgres    false    217            �            1259    17474    tasks    TABLE     R  CREATE TABLE public.tasks (
    task_id integer NOT NULL,
    user_id integer,
    assigned_to integer,
    task_description text,
    due_date timestamp without time zone,
    is_completed boolean,
    date_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id integer,
    assigned_to_user_id integer
);
    DROP TABLE public.tasks;
       public         heap    postgres    false            �            1259    17473    tasks_task_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tasks_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.tasks_task_id_seq;
       public          postgres    false    229                       0    0    tasks_task_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.tasks_task_id_seq OWNED BY public.tasks.task_id;
          public          postgres    false    228            �            1259    17297 	   tax_rates    TABLE     s   CREATE TABLE public.tax_rates (
    state character varying(2),
    zip_code numeric NOT NULL,
    rate numeric
);
    DROP TABLE public.tax_rates;
       public         heap    postgres    false            �            1259    17250 
   user_roles    TABLE     �   CREATE TABLE public.user_roles (
    role_id integer NOT NULL,
    role_name character varying(50),
    reports_to integer,
    description text
);
    DROP TABLE public.user_roles;
       public         heap    postgres    false            �            1259    17249    user_roles_role_id_seq    SEQUENCE     �   CREATE SEQUENCE public.user_roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.user_roles_role_id_seq;
       public          postgres    false    210                       0    0    user_roles_role_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.user_roles_role_id_seq OWNED BY public.user_roles.role_id;
          public          postgres    false    209            �            1259    17343    users    TABLE     �  CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    role_id integer,
    reports_to integer,
    department_id integer,
    salary numeric,
    commission_rate numeric,
    is_active boolean DEFAULT true,
    is_department_lead boolean DEFAULT false,
    receives_commission boolean DEFAULT false,
    phone_number character varying(20),
    extension character varying(5),
    email character varying(100),
    date_created timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id integer
);
    DROP TABLE public.users;
       public         heap    postgres    false            �            1259    17342    users_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_user_id_seq;
       public          postgres    false    221                       0    0    users_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;
          public          postgres    false    220                       2604    17401    accounts account_id    DEFAULT     z   ALTER TABLE ONLY public.accounts ALTER COLUMN account_id SET DEFAULT nextval('public.accounts_account_id_seq'::regclass);
 B   ALTER TABLE public.accounts ALTER COLUMN account_id DROP DEFAULT;
       public          postgres    false    223    222    223                       2604    17573    branches branch_id    DEFAULT     x   ALTER TABLE ONLY public.branches ALTER COLUMN branch_id SET DEFAULT nextval('public.branches_branch_id_seq'::regclass);
 A   ALTER TABLE public.branches ALTER COLUMN branch_id DROP DEFAULT;
       public          postgres    false    236    237    237                       2604    17532    calendar_events event_id    DEFAULT     �   ALTER TABLE ONLY public.calendar_events ALTER COLUMN event_id SET DEFAULT nextval('public.calendar_events_event_id_seq'::regclass);
 G   ALTER TABLE public.calendar_events ALTER COLUMN event_id DROP DEFAULT;
       public          postgres    false    233    232    233                       2604    17551    commissions commission_id    DEFAULT     �   ALTER TABLE ONLY public.commissions ALTER COLUMN commission_id SET DEFAULT nextval('public.commissions_commission_id_seq'::regclass);
 H   ALTER TABLE public.commissions ALTER COLUMN commission_id DROP DEFAULT;
       public          postgres    false    235    234    235                       2604    17262    departments department_id    DEFAULT     �   ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);
 H   ALTER TABLE public.departments ALTER COLUMN department_id DROP DEFAULT;
       public          postgres    false    211    212    212                       2604    17269    industries industry_id    DEFAULT     �   ALTER TABLE ONLY public.industries ALTER COLUMN industry_id SET DEFAULT nextval('public.industries_industry_id_seq'::regclass);
 E   ALTER TABLE public.industries ALTER COLUMN industry_id DROP DEFAULT;
       public          postgres    false    214    213    214                       2604    17457 #   invoice_services invoice_service_id    DEFAULT     �   ALTER TABLE ONLY public.invoice_services ALTER COLUMN invoice_service_id SET DEFAULT nextval('public.invoice_services_invoice_service_id_seq'::regclass);
 R   ALTER TABLE public.invoice_services ALTER COLUMN invoice_service_id DROP DEFAULT;
       public          postgres    false    226    227    227                       2604    17431    invoices invoice_id    DEFAULT     z   ALTER TABLE ONLY public.invoices ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoices_invoice_id_seq'::regclass);
 B   ALTER TABLE public.invoices ALTER COLUMN invoice_id DROP DEFAULT;
       public          postgres    false    224    225    225                       2604    17507    notes note_id    DEFAULT     n   ALTER TABLE ONLY public.notes ALTER COLUMN note_id SET DEFAULT nextval('public.notes_note_id_seq'::regclass);
 <   ALTER TABLE public.notes ALTER COLUMN note_id DROP DEFAULT;
       public          postgres    false    230    231    231                       2604    17285    payment_methods method_id    DEFAULT     �   ALTER TABLE ONLY public.payment_methods ALTER COLUMN method_id SET DEFAULT nextval('public.payment_methods_method_id_seq'::regclass);
 H   ALTER TABLE public.payment_methods ALTER COLUMN method_id DROP DEFAULT;
       public          postgres    false    216    215    216                       2604    17292    services service_id    DEFAULT     z   ALTER TABLE ONLY public.services ALTER COLUMN service_id SET DEFAULT nextval('public.services_service_id_seq'::regclass);
 B   ALTER TABLE public.services ALTER COLUMN service_id DROP DEFAULT;
       public          postgres    false    218    217    218                       2604    17477    tasks task_id    DEFAULT     n   ALTER TABLE ONLY public.tasks ALTER COLUMN task_id SET DEFAULT nextval('public.tasks_task_id_seq'::regclass);
 <   ALTER TABLE public.tasks ALTER COLUMN task_id DROP DEFAULT;
       public          postgres    false    229    228    229                       2604    17253    user_roles role_id    DEFAULT     x   ALTER TABLE ONLY public.user_roles ALTER COLUMN role_id SET DEFAULT nextval('public.user_roles_role_id_seq'::regclass);
 A   ALTER TABLE public.user_roles ALTER COLUMN role_id DROP DEFAULT;
       public          postgres    false    209    210    210                       2604    17346    users user_id    DEFAULT     n   ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);
 <   ALTER TABLE public.users ALTER COLUMN user_id DROP DEFAULT;
       public          postgres    false    221    220    221            �          0    17398    accounts 
   TABLE DATA           �   COPY public.accounts (account_id, business_name, contact_name, phone_number, email, address, city, state, zip_code, industry_id, sales_user_id, notes, date_created, date_updated, branch_id) FROM stdin;
    public          postgres    false    223   +�       �          0    17570    branches 
   TABLE DATA           h   COPY public.branches (branch_id, branch_name, address, city, state, zip_code, phone_number) FROM stdin;
    public          postgres    false    237   K�       �          0    17529    calendar_events 
   TABLE DATA           �   COPY public.calendar_events (event_id, event_title, location, start_time, end_time, start_date, end_date, notes, account_id, user_id, contact_name, phone_number) FROM stdin;
    public          postgres    false    233   �       �          0    17548    commissions 
   TABLE DATA           �   COPY public.commissions (commission_id, user_id, invoice_id, commission_rate, commission_amount, date_paid, employee_commission_rate, service_commission_rate) FROM stdin;
    public          postgres    false    235   #�       �          0    17259    departments 
   TABLE DATA           E   COPY public.departments (department_id, department_name) FROM stdin;
    public          postgres    false    212   @�       �          0    17266 
   industries 
   TABLE DATA           @   COPY public.industries (industry_id, industry_name) FROM stdin;
    public          postgres    false    214   ��       �          0    17454    invoice_services 
   TABLE DATA           t   COPY public.invoice_services (invoice_service_id, invoice_id, service_id, quantity, price, total_price) FROM stdin;
    public          postgres    false    227   T�       �          0    17428    invoices 
   TABLE DATA           B  COPY public.invoices (invoice_id, account_id, service, amount, tax_rate, tax_amount, discount_percent, discount_amount, final_total, status, paid, payment_method, last_four_payment_method, total_paid, date_paid, notes, date_created, date_updated, payment_method_id, sales_user_id, commission_amount, due_date) FROM stdin;
    public          postgres    false    225   q�       �          0    17504    notes 
   TABLE DATA           b   COPY public.notes (note_id, account_id, invoice_id, user_id, note_text, date_created) FROM stdin;
    public          postgres    false    231   ��       �          0    17282    payment_methods 
   TABLE DATA           A   COPY public.payment_methods (method_id, method_name) FROM stdin;
    public          postgres    false    216   �       �          0    17289    services 
   TABLE DATA           x   COPY public.services (service_id, service_name, price, discount, service_commission_rate, discount_percent) FROM stdin;
    public          postgres    false    218   `�       �          0    17474    tasks 
   TABLE DATA           �   COPY public.tasks (task_id, user_id, assigned_to, task_description, due_date, is_completed, date_created, created_by_user_id, assigned_to_user_id) FROM stdin;
    public          postgres    false    229   }�       �          0    17297 	   tax_rates 
   TABLE DATA           :   COPY public.tax_rates (state, zip_code, rate) FROM stdin;
    public          postgres    false    219   	�       �          0    17250 
   user_roles 
   TABLE DATA           Q   COPY public.user_roles (role_id, role_name, reports_to, description) FROM stdin;
    public          postgres    false    210   &�       �          0    17343    users 
   TABLE DATA             COPY public.users (user_id, username, password_hash, first_name, last_name, role_id, reports_to, department_id, salary, commission_rate, is_active, is_department_lead, receives_commission, phone_number, extension, email, date_created, date_updated, branch_id) FROM stdin;
    public          postgres    false    221   �                  0    0    accounts_account_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.accounts_account_id_seq', 155, true);
          public          postgres    false    222                       0    0    branches_branch_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.branches_branch_id_seq', 3, true);
          public          postgres    false    236                       0    0    calendar_events_event_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.calendar_events_event_id_seq', 1, false);
          public          postgres    false    232                       0    0    commissions_commission_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.commissions_commission_id_seq', 1, false);
          public          postgres    false    234                       0    0    departments_department_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.departments_department_id_seq', 7, true);
          public          postgres    false    211                       0    0    industries_industry_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.industries_industry_id_seq', 7, true);
          public          postgres    false    213                       0    0 '   invoice_services_invoice_service_id_seq    SEQUENCE SET     V   SELECT pg_catalog.setval('public.invoice_services_invoice_service_id_seq', 1, false);
          public          postgres    false    226                       0    0    invoices_invoice_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.invoices_invoice_id_seq', 116, true);
          public          postgres    false    224                       0    0    notes_note_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.notes_note_id_seq', 456, true);
          public          postgres    false    230                       0    0    payment_methods_method_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.payment_methods_method_id_seq', 4, true);
          public          postgres    false    215                       0    0    services_service_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.services_service_id_seq', 1, false);
          public          postgres    false    217                       0    0    tasks_task_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.tasks_task_id_seq', 351, true);
          public          postgres    false    228                       0    0    user_roles_role_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.user_roles_role_id_seq', 7, true);
          public          postgres    false    209                       0    0    users_user_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.users_user_id_seq', 42, true);
          public          postgres    false    220            ,           2606    17407    accounts accounts_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (account_id);
 @   ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_pkey;
       public            postgres    false    223            :           2606    17577 !   branches branches_branch_name_key 
   CONSTRAINT     c   ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_branch_name_key UNIQUE (branch_name);
 K   ALTER TABLE ONLY public.branches DROP CONSTRAINT branches_branch_name_key;
       public            postgres    false    237            <           2606    17575    branches branches_pkey 
   CONSTRAINT     [   ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (branch_id);
 @   ALTER TABLE ONLY public.branches DROP CONSTRAINT branches_pkey;
       public            postgres    false    237            6           2606    17536 $   calendar_events calendar_events_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (event_id);
 N   ALTER TABLE ONLY public.calendar_events DROP CONSTRAINT calendar_events_pkey;
       public            postgres    false    233            8           2606    17555    commissions commissions_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (commission_id);
 F   ALTER TABLE ONLY public.commissions DROP CONSTRAINT commissions_pkey;
       public            postgres    false    235                       2606    17264    departments departments_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);
 F   ALTER TABLE ONLY public.departments DROP CONSTRAINT departments_pkey;
       public            postgres    false    212                        2606    17271    industries industries_pkey 
   CONSTRAINT     a   ALTER TABLE ONLY public.industries
    ADD CONSTRAINT industries_pkey PRIMARY KEY (industry_id);
 D   ALTER TABLE ONLY public.industries DROP CONSTRAINT industries_pkey;
       public            postgres    false    214            0           2606    17461 &   invoice_services invoice_services_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.invoice_services
    ADD CONSTRAINT invoice_services_pkey PRIMARY KEY (invoice_service_id);
 P   ALTER TABLE ONLY public.invoice_services DROP CONSTRAINT invoice_services_pkey;
       public            postgres    false    227            .           2606    17437    invoices invoices_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);
 @   ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_pkey;
       public            postgres    false    225            4           2606    17512    notes notes_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (note_id);
 :   ALTER TABLE ONLY public.notes DROP CONSTRAINT notes_pkey;
       public            postgres    false    231            "           2606    17287 $   payment_methods payment_methods_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (method_id);
 N   ALTER TABLE ONLY public.payment_methods DROP CONSTRAINT payment_methods_pkey;
       public            postgres    false    216            $           2606    17296    services services_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);
 @   ALTER TABLE ONLY public.services DROP CONSTRAINT services_pkey;
       public            postgres    false    218            2           2606    17482    tasks tasks_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (task_id);
 :   ALTER TABLE ONLY public.tasks DROP CONSTRAINT tasks_pkey;
       public            postgres    false    229            &           2606    17303    tax_rates tax_rates_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_pkey PRIMARY KEY (zip_code);
 B   ALTER TABLE ONLY public.tax_rates DROP CONSTRAINT tax_rates_pkey;
       public            postgres    false    219                       2606    17257    user_roles user_roles_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (role_id);
 D   ALTER TABLE ONLY public.user_roles DROP CONSTRAINT user_roles_pkey;
       public            postgres    false    210            (           2606    17355    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            postgres    false    221            *           2606    17357    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public            postgres    false    221            T           2620    17567 !   accounts trigger_update_timestamp    TRIGGER     �   CREATE TRIGGER trigger_update_timestamp BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 :   DROP TRIGGER trigger_update_timestamp ON public.accounts;
       public          postgres    false    223    238            A           2606    17408 "   accounts accounts_industry_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES public.industries(industry_id);
 L   ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_industry_id_fkey;
       public          postgres    false    3616    223    214            B           2606    17413 (   accounts accounts_sales_employee_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_sales_employee_id_fkey FOREIGN KEY (sales_user_id) REFERENCES public.users(user_id);
 R   ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_sales_employee_id_fkey;
       public          postgres    false    3624    221    223            P           2606    17537 /   calendar_events calendar_events_account_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(account_id);
 Y   ALTER TABLE ONLY public.calendar_events DROP CONSTRAINT calendar_events_account_id_fkey;
       public          postgres    false    233    223    3628            Q           2606    17542 ,   calendar_events calendar_events_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 V   ALTER TABLE ONLY public.calendar_events DROP CONSTRAINT calendar_events_user_id_fkey;
       public          postgres    false    221    3624    233            S           2606    17561 '   commissions commissions_invoice_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);
 Q   ALTER TABLE ONLY public.commissions DROP CONSTRAINT commissions_invoice_id_fkey;
       public          postgres    false    225    235    3630            R           2606    17556 $   commissions commissions_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.commissions DROP CONSTRAINT commissions_user_id_fkey;
       public          postgres    false    3624    235    221            @           2606    17647    users fk_users_branch    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE SET NULL;
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT fk_users_branch;
       public          postgres    false    237    3644    221            C           2606    17653    accounts fk_users_branch    FK CONSTRAINT     �   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE SET NULL;
 B   ALTER TABLE ONLY public.accounts DROP CONSTRAINT fk_users_branch;
       public          postgres    false    237    3644    223            G           2606    17462 1   invoice_services invoice_services_invoice_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invoice_services
    ADD CONSTRAINT invoice_services_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);
 [   ALTER TABLE ONLY public.invoice_services DROP CONSTRAINT invoice_services_invoice_id_fkey;
       public          postgres    false    3630    227    225            H           2606    17467 1   invoice_services invoice_services_service_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invoice_services
    ADD CONSTRAINT invoice_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id);
 [   ALTER TABLE ONLY public.invoice_services DROP CONSTRAINT invoice_services_service_id_fkey;
       public          postgres    false    227    3620    218            D           2606    17438 !   invoices invoices_account_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(account_id);
 K   ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_account_id_fkey;
       public          postgres    false    223    225    3628            E           2606    17443 (   invoices invoices_payment_method_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(method_id);
 R   ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_payment_method_id_fkey;
       public          postgres    false    225    216    3618            F           2606    17448 $   invoices invoices_sales_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_sales_user_id_fkey FOREIGN KEY (sales_user_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_sales_user_id_fkey;
       public          postgres    false    3624    225    221            M           2606    17513    notes notes_account_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(account_id);
 E   ALTER TABLE ONLY public.notes DROP CONSTRAINT notes_account_id_fkey;
       public          postgres    false    3628    231    223            N           2606    17518    notes notes_invoice_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);
 E   ALTER TABLE ONLY public.notes DROP CONSTRAINT notes_invoice_id_fkey;
       public          postgres    false    3630    231    225            O           2606    17523    notes notes_user_id_fkey    FK CONSTRAINT     |   ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 B   ALTER TABLE ONLY public.notes DROP CONSTRAINT notes_user_id_fkey;
       public          postgres    false    221    231    3624            J           2606    17488    tasks tasks_assigned_to_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(user_id);
 F   ALTER TABLE ONLY public.tasks DROP CONSTRAINT tasks_assigned_to_fkey;
       public          postgres    false    221    3624    229            L           2606    17498 $   tasks tasks_assigned_to_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.tasks DROP CONSTRAINT tasks_assigned_to_user_id_fkey;
       public          postgres    false    229    3624    221            K           2606    17493 #   tasks tasks_created_by_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(user_id);
 M   ALTER TABLE ONLY public.tasks DROP CONSTRAINT tasks_created_by_user_id_fkey;
       public          postgres    false    221    3624    229            I           2606    17483    tasks tasks_user_id_fkey    FK CONSTRAINT     |   ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 B   ALTER TABLE ONLY public.tasks DROP CONSTRAINT tasks_user_id_fkey;
       public          postgres    false    3624    221    229            ?           2606    17368    users users_department_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_department_id_fkey;
       public          postgres    false    212    3614    221            >           2606    17363    users users_reports_to_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_reports_to_fkey FOREIGN KEY (reports_to) REFERENCES public.users(user_id);
 E   ALTER TABLE ONLY public.users DROP CONSTRAINT users_reports_to_fkey;
       public          postgres    false    3624    221    221            =           2606    17358    users users_role_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(role_id);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_role_id_fkey;
       public          postgres    false    221    210    3612            �     x��ZMs�8=#�����E��d�$%���q���e.	I�H@�R�_��~)���ȻS��ʀj���u3!{L�P�V��2+%i�G��*��j��q�:��ף�������dKk28Kt��A�4��<k��.Xxـ����A�:�&<<߄�ga8����A*ew�F�L�;����:߱ka�.��,�eݙ�ǣ����tM��F������%��ȧ���)�إ��L�z�3Y��p-6Y�?�<�l��D8+Mg��x;wZ�=�5���HQ��|�>=1�sډ���h�؝V�2+$O*[�B����M�����`~�(|�-�qY�+�]�iv�ߕ0�)@FG�&����f%�L-����G1�"�1Yj���̖&KJ�`2�dk���Z!� a8�/�Ԇ�u�� �W
��Gq�T�7��k9Ӻ����8�p\�ʔK]Y��W�B�x��{�E�!�B�Z	�|�a��#j�x�;� ��6��B�ܖ�̴f��(&�wRI�n�]g��ٵ9����4+�-�8�XQ��`������y��}<V�lȢ�5?q��	D�?�.o~Ut���^"md)�\��x|~��Z�G�;1|B�G2c�b����E�/3��8��aw��,���i~�g�'� `3=����z�C�U_+�͝zrh\
)`�����O�ٝHVb�	JU�fíP����e��yk����-�øM������*�*-�����;� x3��g� <������_*�WmV�\"�Yl��{P@L2q��C���L��sʕ�s��8��c
���J�Gx�RiJ�t4��j�nr���+�_��ا�.�}JUAE����S���=�o3%�1�re/`�n\�!X������y����
ў��a�i�Q���Y��p�-h�#��ޞi�`�q��B�]͡�U-U�ҷ�f��wFG`� D旨¥�R-�ϥD�Ae�]f�4rk�/�Y>����1O��sXD��؈#6"2ٕ�W��^�W��W�,ǵ�e3�a�2�
HP{�>B5Y��b��[8�DėT��TF�<���o�w��km�����*�f��]�A�,zX`bl�<-��V	��K�À��ي��5��,�#V8#�gB�i��;Rm)�ݕg��X�e�b����-�ԓ39D�G�lj����,�(c���hi��D1��� �H�wF7�d
�ItpQ`+��yڇ5�01w��Կ`#�:[42��/�]�tD� K��wdp
�Q盷U��
TNQH�<׈��"jg�ܺf�M��>�'Ts@�%�$
0�ː5[Zi6��9.�N�5f4D��$U�F�	(/��֖�&7hb�D?wBi�ci���A�_�r�� E��1Tfnac_DO@�e�W4r��43a�x,{8������9����c�nE�LP���V�(���Z4G��l��^���ع3��(�^UBWE�^��=��rש[��j��g��!�U�� v��á���-�,���mO'K���H�ܒ��;���/tB�b�W[o9����
7���a���;��� �DRC��+j��Nl�cR�.Jܫ�;h�d)�&�;#eA�����r�m������&�Pۈ�(Ԝlo��E���,_I��R��U�ʐ�lڱ��{�B|1��t;��zX���ڱ@���1)Јu?�N��}���m�}��q_��ڱ�)G��¬�3�:���@+a�K�ۯJ����BQ6��/�d�]_�r��m�?m�^�@%�Mem��@��>����h@���L����_$����5Y��蹴��E.��N�jo��\����;D�hG�6�A_�e�z����&�R���|aR~+E
�ӛ�� f��z�l�-}9� 9�	��u�����$(���C#�< RX�p�d S�Ns������vf�cu�����B�=��Nw�y����f��4M�o�����[��& ������&$�f�E���&�"���HH�:M�W�b1�HD*��#�n#o��5����\����z��?ms&o��� %l�����j���W�Jt�nJPY�ܨ?'�A�A��^F݁�O�U+�?��*�=�Ok�8������@4��N�h/*�q4	)�vT�sS~/Jh�mT�����J�D� U�\o����	A���M�_�0�`�6$�����
�++���9�EjS�r)�v}�F�>&�i�j7�u�p�Ь�#MV�#=��s]�m��u.vǫ�3@E��'3��!� �?�l�,{8����[���L�V�7�=��dA�� b�V�̒Z�m *1���/kx`�[�gH����7��L{�� �������o�Ä8F��[�
y{l\���v��R�0%>_ܛ��>�#�yf��
~#����P�/~��Q�j���ŏ�AA����hqL��?��A�-x�Y3��X9	٨�%�����
����N���F4a@'.�>�E�g�		���	I�$��k��&�=Ǿ�<JOF��`��M߮�r�/T��j�?V�}=(���Z7)�i�,�����H�C��&~JzO�Q7�5�е�{�̂����������l�L]�>ʙL��ԯ�"0���o,nyZlf��0�
��p@{���3`�a=g�i��ϵ90�{��w�]���J�
�L�g�4*�o��=��@e��u
vWx&����2����ӅЏ��e1�s��)��t*IĐ�����(���$HS
q7a�@U�i�A_}U�o$v�M�	Ʉk�:r.�{y7�SN�l\G�����y�<�\�Y���ݤ��@�ݜ!��(��a;kFq��'�C�yD���/���'&\��zQP�04|����*A����6�چv�s�H*�R��{7��wy�1��}L}D��^�o=$P6��)Ȣ��3�
:��'������OR�9���x�a[n>��N�Vy�}-�C���b�J��C"l�n��7���	��&N,��U�\A�^k*��+��S�7T�A3���܏�@���J��f���~�4Hg��Ɣl�P���.운��п� ���l���x����y��ի� ��Qm      �   �   x�E˻�@��z�)� 3�hI(�"&hAbC`�DdͲ��XО�|e��>�(e�e���]g��c��#�C������B7��.��`�CF�H����t���{����Y�Ǣ22C�3��ο���ԇ�\?�
�Օ��E"�&^$2���J�7�;�      �      x������ � �      �      x������ � �      �   d   x�3��M�KLO�M�+�2�N�I-�2�tLN�/�+��K�2�t.-.��M-RN-*�LN�2�O,J��/-N�2��(�M�SJ-�/-J�6������� ��      �   �   x�=���0E��+21"�	: !�bc�"����U���������qW)�4�Ͼ�@
[ׅQ$�_�W�e�
v�.u�D����5�.~CmX�%C�����/�r&U8���d��y�7.I�TkFK�%5�fSx���8�      �      x������ � �      �   D  x��\�nG}}@����bc�<$A��}�#�6aY�Rt���=շ�5���� �MUb��{��Nv�]����������e����p���p�2���(�42����x�]�w����{���IR��M�̭�[v2����2)�������t�?�w��������?��ɼ���~�u��t��Ȉ�������#�W���Ę�w�>�>u���E��������a���|x�|������#M���|9�C���[�_�?B��o�w�~���|~x�1������?8����t������xx~����-(�|h=Vu,}+子;!�����O���/@��)��!���7Z�ޓ���[�L�Ɣ���8��~x8=?���x�h�ةBu*�x�|��).�/��.n�P��t�;�c���<�/��{���b"`Ҳ'U�47R�"D�LC~0M����K D��?Mܯ��w폗Q��ޟO�w�wO��� �+�GV~㟇�����}ai y�A(�W�"���/�|(oW�r�e�qw�}>=;��r��[��������0�8��X���Ω�" �һ���]$??|��ϗ�����<e{�.��x���A��z�H�Hl�r� \������<
�j�Ȕ$I���HJ[߯�3B��n���G({`�q������dg�`)���6�[+#��t��[�w�h��t>��:Gd��/�â���F�T�c<�s�r9�=#��Ǿ�`�4Q�Ζ�����Bok~N����[=Oq�z C7~U��[ܱ��e�#\N&\�|�b��a� jP���#D�%�p�?��<W��ӝ��!���|�N�R���:��f�z��\m�ڎ�p;�Ꟈo��Ho\c�(8������+�!��F�����mL	��+}�������}~���/�����ߚ�:&�k����S�Cr��]�k�����޸��QgRsP퓜M
�L��s�m:>�y:�bм��-��7R���fE���ފ) 	��R@r�K���/�Q�N����G������3�k��ߛ,����v�I�I�g����������!��U}�S8�Z�ϖLB����%�����|��@E{��:��ѱО��B�jW��� ���;�g� �����:�{'��ke��ʾ�����㺡v=W�p�"�r�6KV�,�r �^�	�<�F@�9l�z��ѧ�;�mIhM��������	��u(<H4\�[I�X�Z7t��
�֓>
	��6��Q{�Ja9-�G�_�V6�IB��F5�v�]�!E�"�HF�l[9��8��`H4K�B��buտ�A���iN�+b+�#��d�?]Y�����"0
8��{�SI�O&�U�	 �$i�c�fhX�,껪>r���ۣ��>��c�L���;!�O�m߫�(E�Nc�_� .1IlUgBڇ)�Itz;@�����<��PN��CX꯸�Mb+��Va���Ơ�H�"�.�'E�s�T��G�$���'�)'j���B�a*�
�R��R��oKb+76�+u%* Z�*pa�+�r�Ԧ�{�$�2�6��Ԧ�y�t�{��^g�	��	8��J��(ֻ
���r+:׫I�dx]f(��5MB!{�f �9���,}J	:˭��%��c����䆦[Rn��*���t�P�8����n
�1)t0�DX�B��jd��(p!�i�T9�Cs$��'K�+\CO� ���i�JJ0ޢwEc�Z�V�I\´l�)B,��,)��	�܈Ȕ�&-�!M\L���uH�$EqV!�n��px�Veh.[����y�W.|X1����cdlD�D����bГ,S�v�T\9�rS=5
�h��uB�-B�H*�$V�\�"�WN�Rq}#�J��(oʀ#p�K84�>Y8ܲ�l\۽���wtM�W���/d}+L���3	������&�g0��9�""�K�W^�# ���;qc�zf��|d�Pc��b''�f��fa%��(�">d|h�ޖ�t2FFb�P��"�� bnv��RF5`4#nNc(��`��>�k�����+���K"u(F�%�ز5N�Q���&E,�S3j�g�#�T��O��|�]�h��
M|^�M���m�j�]+c�(�Y$e���Pj��,�J7Ew m�V�'��A�(c�bgm_��Iv���c�t��/�U��(Ft�|.~01��P̓TG(@Yv��������B2�JRr�eC*� ����i������j34}T��@AI6���w����Sʲ�S������aƲ�k��0�CEH(����V��Ev�(B�L͎W��gmd]$1ϋ;j&�_�W��'�|Yv+O�c|ȯj��9++�`3@�3��2� �@L�[�x�:�S��Ъ|N|�CC�u8˃����4�i�Yv+�Yg�ij�m�ɺ�R*�5 xS�)v�-�&�"���s`\��+k�U�N�����5�Ps�� ��VUCύɝ�nW?���R(CD����{��&٭��g]*��6F��<<�x,!L���W�m�4x�����6��IN�/`ڍ��w�Ҧ�k��b�jEt�A�g�M@��##<O"�,he#�>��z��_s�B/�@���r��@��&���uamG��o3Lί�ǵ�C(�[Xb���r��B��K�Ik�Dn�ӆn0[�OG��خ�7�I8g��Vʚ|�5V����թ�N�JO�)�g.Ò]glZY{5k0ѭ�Zhkj� � ������ �$�&�ȯ�I���ꩱ�u���A��j�$H�4�Ъ 0L�D9aZ����[��� ����}LB+A���K"��4�L�I� *�0Y�79|ԙ�V����Y��Z/YY
��B��B*�V�@��$�*��i4�%�W�z� �`����Q�ElU ���`W�D�*)I��̞`2����-8 ��Uq0{b�V����/�(6@�dO��q�g�I�Ynu ӓ��Z@H�&���H�a[X���*�S_�d�;�lK�
�ʩ��dq��� n*��2ɭ��&)*�%��J�@5ϫy� �!��V�4��F`�h�H�{�sz�U��0d���%%ǹ"����ˍU�Ad��Oƾ�d�-N�?4�W�w�3a��W���^u�!#��������Z"�L�WE�g��Q7�Ƃ�9N�l�o&j��o���Ipe�J9s�_ae3�I�(R&���O��@x�M���xdHM�*\!~h?���"���,iOV�0�N\۩hFV��a�A
�3L��^�L�m��/,�����go �5��s���B^Q<S''y����b6	�&����m��/Zg3W��S�9��$�vֳ�%��]y�52K��
[��؀b���VѳGJ$��)ɖ��7�c<��8�j�i[ӟ���I�+w&@���y�9[
�w�MlM������K4\-��ʻ��3ײ�m�<�H���nU�]�B�D�dg�±�³�N�6+OY]ɫ�-+� F1��0R��Z��,�	�H��YH���ʺ��4Ɨ���K�5�Ԭc�W��!���=�%���s�
��ѽK=����땣{��ne�0�q%���m>�
���e��0A!�)t
Դ���Vd7A�c�6�T)�ω��k��߀UH���쌺y<WUEv;�NL1^C�P��g�D�
�J-T��92�n�X?�5���DZ�6�v|zB7��1*�8L�|>oK�%����1��WQh��aH[^���R>�Y[-~2�n�p���\{P�����&e��mȞ��o�s��F�Jr���d�B�����P�C�[�������l3 �dC��$�e��:�onn��X��      �   B  x����n����O1`�C��. @��Ej��4ڙ��~�{l�d��Ul�2u�ϯi:�����u��=<?�wO���z<���|�ew��zXϧ������eg����7�?�n�}gɆ!�߯����nwxܝ����q=�������px�j�u6�w���������y=��2�����{�O���Uc��Y�����J�{��n��i�=�w�i~�ݷ�}������f������n���>�·���z����~w"�{�6����4x\�|^O4�˒?���X�������7k��G;-���J������>����i��p�=����Ȟ�`Mfo��%��'2tޟ>��������y����^�;��Ϸ����:T3g�MOP1[3ah��ӥ�r�����5a{3ۮ�����K�7�w�� �p�ݢ1h�����.7���h)��[�k�ř,Nl������G�z8|������<��.jؚ.dsV�d�=�\�����R¶}]�Sn��5���{�ud�6
TnݓuW���Lb2R�ooIN&�햢�*��$�!;���y
"�Ktl�CVC���%c��o��C�Q��	�=��qCN����q8��!�Y_�Ňk����(p�o���aG1�T1ĝ�b�5�
~J���DN����pr����S49i�pI��$Ŗ�,C&�B������><?�N��׻�{�F��u�y��\��b�7(:�̃�SPyTo�q�@e��P�B鲶y��J^�~s�J�m9�?~j�8~�2|\E��=��k���Bfh�o���@�4ԞO�
�AuDe�3P��vM�p8C�Dɶ�g��qy�r o��C�pES��8���7�Y�x �0;W�LU��ty؏L`�<b����T�b�G֨��W�J,�G.)T���5�0�<�G�(՝�d�/�$�ʆ-_�I�����nP7.��	��{�o�T�����ڎ���U����D��քE��T@2��* <(���y��4��'󈞯��'��4_�Dyln�\��*�v�|����\P����@$�7�̳�^ �r��j�M���U��Mn�;�+	�ar�-ַ/XQ6���-@[�le�]#�q��(��t����8��K�*�)����/��|`��z�jCLd����nB{��P�	t�Z��]��XY��v|�Aa���6��P���}?j��]������
�~ʎ"F,`�pb���q�B�)p�LG�7��Q��e���Ս��B;A��a���0�W��P������<�:Z��� KZ	���k�����P�L�n�\�
�����B�
sh�(�[c�� ^��¦z�Px�5�� �4��6d^2�#o*H|�X�Х".TF"���q�7�X&!��-yr@@���q�j8���t�GH[QA~�ϒ��/��,)�2?2�C0B�q�m,�~y�ȷR0�Ȩ���ɠ�2�x Ԟ��� ���wl;[�oჼ
���b�̇���F��1	�7v,�� �Baq�LG՛���q��z�߮�ï�����iGj��s?�B��������D��n����4_�����?>�^?(��ulrپ� ������>��8����k���K�c��;p��l�\t��rz��
�G'�jch�ưzƈ�H�6��+Z��`���.tg���ͫi��-�ݯ�d���Ѕ�S�/�All�B�ȗp6���d�/�E�;*?����.��f���K����~-�5-�4�t
qF�CȜ��'M>�N���t�>��oN>d2/�6�M�p�`�h��V~�( �9m����6;�bs�̸Y�h����:���o ���<"�#͡|yI耢����Z��0UnlB�yA��hl~����*j&�@�������A��
DJ��f�M4��`g�(�����ac@+�ZN�(`�7�c74��P��.���5 s���'`�w���&�/��AZsl]V`���3@�ڝAGщ,6;m��AR|�F���|�Q��MG����ڀP�9���w|Em@�����Jʯ�V-F��t
6 4к�J����ve0
�*���3�FkԄ��棢�����F�XD����L'�QqN���vw9�cȠj�v����Pk.w��i�쬱�2?���){�u۽�$�N�]cl�o�S]<��5�m���k�ؤnXJ�dl�/ ����(�\s�E0q0Ȁ��o�PI�*�5�%� d�RF�m����h<�wsu�1Hl����}���y- �ͳ\+CE�^��YS}�\�fQ�����V)p�YV�JR�`A�wő얻�9���C	�]��"�B��nb@�¥�l��O������&�CS���D%E�n`��-�f��h�T��*�����P����[f�V�Ƹl�EP�����$�+�8�� �k�^~k��Ca��]�V�
�A�Z�1�Z7h�@_��}2R?:��㦩��އ�!d�^^�P�B��^s�8�	����B��x��$��F^�P:��#+BE�.�1rI�j���F~BN���V�2;l"�Q܈"h��j�-2�B"���+�P���A0F���+z 춀�G�0y�T���+�P��!c1� �O@��PY玶�H&74�W$A6P�sDDB�}2�J"4;� �������P�%�����:�H�#��D*5	�PWБ?A��]DD��^@�"���E(vY	��г� �u��2AV�Ъƀ�̝@�'�����eՃ
�l*�ZLd5�*�&T	� , �g�B�	$�Ph��T������ހT ᙑ
U�;��P�<X ���	��-!*wmp�$(�����K�J}��.���	4Ƅ>jL!4��.�dɇ��K`�ʈANC�.�]#�]��Y��FL<aZ)YN� ���A�C��=�̽<���=��nh�
� ��+{������)�P]B�|xM�EA��ʃ�= ڢK؃����L��s�:h0�6hƷ��6��?A�I`5o�ʠ2���$xA���K�Y�v'�Z} �b֠RC3O!%���@�O�����$���T�(c �)]Ј�p9eP�~� J�ʎ�x��8*��R���r�b�@x~B�M(}P���L� -`� (L.�Z]⻜5h�I��9hw4O��f�a�4���:(�m
�B"��ހ�!��VA����F�"�W����<N�Bѱ^y�f�=���*qtȎp�V���Jh��K�G(]ָ�F�R=�l�BQ��P�D���Pu��~��N�B1�%�A�A�Ua��p]��w%�*;n�d�@M/8nP��#ܠr��e4�AQ�l���(�I^>(&�3Ї������K�5��2���g�d<y �OO��V�|P�mu^> �����
�E��]e ���'h��K��@�{��؆gOh��3���h�z���Շs��}����p��v���7��n^+|���{�	_����@����9�:Ƞ�i�p��#�@�4�W����S�p�S��뀂R��	P����'@A�m|����{�4z`�k8�������������P<%�A�������A�[5�~ ꩾ��b��� ����4O {��JhW��o @�7xu(	�Py��@�2�x�<�OP_�{���l��t�N�����˞>(ۼJ(�S=yP���	�l�&���~� ��x���0��|��I�B	�*'ZL=�����F�U
0�F��=$5��Kz!Ty<X�/���{�؂�^<()t^��A�~���ݻ���&(      �   9   x�3�t.JM�,QpN,J�2�t�HM��2�tJ��VpLN�/�+�2�tN,������� b�z      �      x������ � �      �      x��]Mo�=�����{�c��^dy�V��J#o��Sd�VL�׃b5��1DW��#Y��]���o_~<޾�?���<><>��|?}?��?��^��輪�������|~���w�?�SH?����bw��C7^}��?ʟO�+_�Mv�s����cW��y�����ӝ/& ;uɼ�e��K��׺���̲s��0v??�z���t<�/��P��᷻������,�����᏷����n�����໘�����N�5�|<��.�����|����������rx9��v|=_H�����ԡ����������x(R^���_e�������׷��˱��x8���ߟO�g<0�h��.�.��w�zU�U���ԅ��]-�_����;Q�d�{��w�]�"׋	��|��/�Ǫ��b���j��6��DG�ǆu}��o�/�KU�p�x��9G$8�E�s��P׺�q�
V��&s��/���A�qQn�r�k�9X��c�L�[E���IDoaXyQp��Y6����`�s����ȾK��R��^5���$���EO9�:��'��*��ڒ1��:B[�+zV/�_aM��YVZ��Z,�jh=�jU�����n[|c���p���(�f2N��Ptq�b:�����c���s����ul�C�nq�Iڴ��[��.N��m��FF�r1�f��>֌�'A6Ʉl0rVo�?\d�n6����t��^�Ϣ�;={|����_��^��?�
�o/?��)������ml��^�3���1�T��%�+6� ��e�<��r�*�](���5��(l�^%���Y2���:�5'|��@�� ���W���`����
�\It]F��8��8��H�N���`��T�=\� �&]�n�2�(�Ƃ�WVuᣡ�I�M��x��`Y���9��f��6{A4�eԺF`�f�F�&k��~���Y��&�bWƻ9)�����`��s�[M�}Z�x/�K8ҙ��j���O!$��5��I^��~-jYd��mL�e� �̓ �aǋ�
6n�7��IXG� Ӆ�2$}T����ν�x�ݎ� �6⦹Nd�{-C�j���$)��wX��e憤W��E�ZŴl���i�	�:FR��(
�-f�e���+�2�OV��5�A�E&M$$����h�?��d^4:�A��Յ�U<uz"��R�1�m���5��`���4o�^j�h�f���[*�nT��$ڏ�i���}C6�Z�1/{�|�oP�Iq�1ốt����	�i�p�.������%�qpj�("��j���́ �(c	��kS�,��nLBG�w 7p49JR�F��K��$<ݾ˶8�/����2���90L�K���.�xRdS[r�� �br
ij��*��$ؤt�`Js�����kR�Nu�{�	�㤸�V��I�&Mf�
��D��E#3=e�,	�q��{<�
gL���P���[���QB����I�M���m� �k�SPS �V��N��r�|=�wa��|$K����wQ6�~^pGѐwI7��V7�T�C�ր/
�+�i[D�0*���E5�:�	)�7x7��0�7F4��;��:߂:S���p�M� �?	��^����J����ىR����]��bYl�{�.դؔ����1�=9BQ,�о_�7�����s���ƞ��@�g�W����D���A��W��!U�����!��������`,����F��+�n��]�^X���b�JYv�cj��zMx�~�N�l1߬�M��R��'V�AyimYx	�鱛�Ķd��d	߅k-�����~��]���j��lV�F%�t-����*�i:�ʢ��|�5g�#���f'<�a����U:���P���;�Q5��Vʤ�6��1��z)�6�aYp�A*wL��{V�q�Vv<�x�4-L��^��n�5���IGN�ea�"6j3�a�l�F\))�i<H▎���Xst,���S��5��b�cܕ��>�5��3$����M�Җ�z�ǅp����W�~���T��x�ktL�\�k��͡�u��օS�9*��,�Q�S�f���YW�Y���j��i��^ Q04�3č����Kne��Å<*��TtÆ+ɓv��U�y2�]��|�>۞e:zm:4�sAs�8w��A����B��P�{i_�o7���X���ghz	�x��m�'q�����[��(7_�a�������nk�����*L?�5CtJ�P�g�@{��e?x�@��|\�f����Huk�
�k�#'��1kV�ɲ�z�s0�=SV�t��u��{��0,�u0�I�^h���#�*[�'�ݱ'�(��]sZ ��Ӵ�+��56	Ɣm�š��xfeb��A��2�`�iM�{L-�x�ɡ��ahcA1��G-��9t���A���Է`m�=�ۣ0�G%M#�n~���$U7{�-m���4A>M���e���a�N���$2�*�,1�NO�˦~-J�ê����4�Z���+�͊��H,|Xư��=|���Q���ӘA{wb�����Y��isO5��6V��絹� ���p�F�C�$	�2��A�#���C� ��I�=/5�]��am����(1��u�,��֍ku����(!v����y"�.�XǼ[�{����
�m#��,b,9(�ف��M���IӬt+��k�`� ��x����C�vЄ�~���4�r>mhB�p�m�LV��C�����`dq�m���A�,0\�L���MG�D��2�U2%�A���څ&,hn4�i��LAI6lG�L�Y�;{��t�d�*Kn0����[�iI;�6�l�o+=�L����^�-�>
a�NB�&Eԁ(V��FGvQ-�eRe��e��4t��uZf�5�}sC�9�PS�f+��t��Yo�,�aB���A'0?2�J�g���a�"�c4��E�<�^I����L���*x#9�!a;���<L�����d,6j)��hKT�����H�1i�
� Bm��h�ex�(yZ����4��.2���N�=�#���ҿ}����bYmH0�6?/<k�\�(��8���-�T���`��;*ر��P+�V9us�u���Nw9k3O}�O�A�!C��o>��De}iЄ���1:�����,���o���
ϻש���,�I��:V�3�B=����P?������ۚ�;��X�N�I{4�^l8^�vez�h���e��d2֧�]f?�1�-�\̋��t�z8���N�i0��tp�ww6�&R~��A������O�ӻ�L����!����k�.;ͯ�"pK�2���bNst؞�\��?��m��6�6�q�{��y��"Ӡ�7@]L�qzt�h3Qڪ�}��������:���1Mo���������?A�I�^p�2ƭ}�rC�Z���L�c+�L��7S�z	'����=sFK��}������dݓ�2+���M�1��h���G���O�e�I���٤��m�Q��i��mm[eL\~�����^@u^�mXp��X6�˸Ꝛ�7�iX�V�Fg�L�C�i�|�4N%�I���d��#Pǣ<`ꤡ�3�ƽ�]j>�����.t�����j�{���-4/#��҂z���Xr^���3c�Ӣ��c?n:����
|�Qʿ�J>*���@�ݤ�qst�2X�+� �t��^�^m8�v�@=�z��1E��Q���7��00�>)�1�U��T�%6c}[�sy}x�B�)R�[�\Mݮc�4F��Nj�Oclpƪ5)��:�����n�-�2��m��`l��l L���A��Z��o2����������q棘'��QqX�rg�`b����؞��8V4��7x����}�D'��o8}}���	�0�#�$ �&(T�p�'e#��G&�e4��VJ��V�T�쨄'��g����w�L��~����RnJ�E�ǚƺҚs�QD�d���xZ�%�1���T{��쯓��(IgB�m	�p�q w   �QJVr� �eR�p��yXW;� I�n��H��Ф${i��к��^�<���ņ�#��C����GE>{b'���&;э�ބ����z�7^\\n�mY�F%^�Y��A��ϟ>}�/�n�      �      x������ � �      �   �   x�e��NADk�W���	��HwE�4f��,�ݕ�w�>>�kH���x_�dJ�F���pz���j̆J9X*+5_�p;3�F��u�Xk�f������<��l���N�e�0&�)R�e̞B��6[�v���a�ʜt���7��Ņ�^Fk�{�I�Sݷ�����y=={��GR�h�Ǣ���^�t���P���?þ������8[bQ5�Z�D�*�����P      �   �  x����n�6E��_��@R�^��$�'A�l�-�%[/P���s)�;�L�D�]^�Z�%�-�S]����߷�@�����?szp�0e8}��#pF��#v%���"��W�I����ɵ��á*�`��$��WL\��;�^3qEA*b��J���|*�u����)D� $��|�Q�c�YjCʐ��:(T�i�1�����y=t|l�_���X��YgC��:U�Z����E����G�,AQ4с²Nl>v�s�IR͓�TP+3��G'�)C.0�(= B�U�d�܁[PU��1ݨ�2�����ڵ��!t����q�)c�����:��8Y(���aS?W�mQ:�Нj�7�ܷ���/߮�'�w�[�9u��K�žk}�K^,^�YF����p=U���}��~U�ճ����E`;�lI&g3���Y[�o�{����Ƴ�֘W�-b������詝[�hs���y�÷=&&�d�3����~���8M�/]�q,�Xo����y�xṱf	�eBL�����0��M5�E16�����T� ����ލpR⅌��5�[O҇A5��֦�_z��ᴶ3? r����X�����?�(�����t1٘��Ėx�^eUv>_B���~��N�E%����6=�%&���5��1S���'�P�]�q�pRj�!f=`D�h��0��F�[���5gd�	m���|,�;s��|���gW����z��گ�8���QN��9��g���v&�Jx`K@l�ZU��#�~:s=؄>��Kx!�p:�:`J//�k���t���]�����y�ն1�fK���NU�?=0��y9�} gN����f�Im�1ʻ��}>	_1f�0��+�������ikD|�p-�ޥ�X��6����k�z4A�����[����맱f���p2[��S������L     