-- Table: public.users

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    id uuid NOT NULL,
    username character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    salt character varying(255) COLLATE pg_catalog."default" NOT NULL,
    client_id character varying(255) COLLATE pg_catalog."default",
    loing_count bigint,
    logged_in_duration bigint,
    logged_in_duration_last_login bigint,
    CONSTRAINT user_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
    
-- Table: public.characters

-- DROP TABLE IF EXISTS public.characters;

CREATE TABLE IF NOT EXISTS public.characters
(
    id uuid NOT NULL,
    owner uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    abilities character varying(255) COLLATE pg_catalog."default",
    inventory character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT character_pkey PRIMARY KEY (id),
    CONSTRAINT owner FOREIGN KEY (owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.characters
    OWNER to postgres;

-- Table: public.settings

-- DROP TABLE IF EXISTS public.settings;

CREATE TABLE IF NOT EXISTS public.settings
(
    id uuid NOT NULL,
    owner uuid NOT NULL,
    sound_global_volume smallint NOT NULL,
    controls_forward character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_backward character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_left character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_right character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_jump character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_sprint character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_crouch character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_interact character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_melee character varying(20) COLLATE pg_catalog."default" NOT NULL,
    controls_granade character varying(20) COLLATE pg_catalog."default" NOT NULL,
    graphics_quality character varying(20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT settings_pkey PRIMARY KEY (id),
    CONSTRAINT owner FOREIGN KEY (owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.settings
    OWNER to postgres;

-- Table: public.maps

-- DROP TABLE IF EXISTS public.maps;

CREATE TABLE IF NOT EXISTS public.maps
(
    id uuid NOT NULL,
    type character varying(255) COLLATE pg_catalog."default" NOT NULL,
    max_players smallint NOT NULL,
    players smallint,
    static_objects json,
    settings json,
    CONSTRAINT maps_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.maps
    OWNER to postgres;