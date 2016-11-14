--
-- PostgreSQL database dump
--

-- Dumped from database version 9.3.10
-- Dumped by pg_dump version 9.3.10
-- Started on 2016-01-22 14:36:06 GMT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
--END;

--close any connections to the test database

select pg_terminate_backend(pid) from pg_stat_activity where datname='FCO-LOI-User-Test';

DROP DATABASE IF EXISTS "FCO-LOI-User-Test";
--
-- TOC entry 2130 (class 1262 OID 17007)
-- Name: FCO-LOI-Service-Test; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "FCO-LOI-User-Test" WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_GB.UTF-8' LC_CTYPE = 'en_GB.UTF-8';


ALTER DATABASE "FCO-LOI-User-Test" OWNER TO postgres;

\connect "FCO-LOI-User-Test"

--
-- PostgreSQL database dump
--

-- Dumped from database version 9.3.10
-- Dumped by pg_dump version 9.3.10
-- Started on 2016-02-10 12:05:44 GMT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- TOC entry 173 (class 3079 OID 11787)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 1983 (class 0 OID 0)
-- Dependencies: 173
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- TOC entry 180 (class 1255 OID 63832)
-- Name: get_next_payment_reference(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_next_payment_reference() RETURNS text
    LANGUAGE plpgsql
    AS $$

DECLARE
    v_reference TEXT;

BEGIN

SELECT 'FCO-LOI-REF-'||nextval('next_payment_reference')::TEXT
INTO v_reference;

RETURN v_reference;

END;

$$;


ALTER FUNCTION public.get_next_payment_reference() OWNER TO postgres;

--
-- TOC entry 170 (class 1259 OID 63833)
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 171 (class 1259 OID 63835)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres; Tablespace:
--

CREATE TABLE "Users" (
    email text NOT NULL,
    password text,
    id integer DEFAULT nextval('user_id_seq'::regclass) NOT NULL,
    "updatedAt" date,
    "createdAt" date,
    first_name text,
    last_name text,
    address_line1 text,
    address_line2 text,
    address_line3 text,
    town text,
    county text,
    country text,
    postcode text,
    telephone text,
    "resetPasswordToken" text,
    "resetPasswordExpires" timestamp without time zone,
    "failedLoginAttemptCount" integer,
    "accountLocked" boolean,
    "passwordExpiry" timestamp without time zone,
    salt text,
    payment_reference text,
    "activationToken" text,
    activated boolean,
    "activationTokenExpires" date,
    "accountExpiry" timestamp without time zone,
    "warningSent" boolean default false,
    "expiryConfirmationSent" boolean default false
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 1984 (class 0 OID 0)
-- Dependencies: 171
-- Name: COLUMN "Users".county; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "Users".county IS '
';


--
-- TOC entry 172 (class 1259 OID 63842)
-- Name: next_payment_reference; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE next_payment_reference
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.next_payment_reference OWNER TO postgres;

--
-- TOC entry 1974 (class 0 OID 63835)
-- Dependencies: 171
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Users" (email, password, id, "updatedAt", "createdAt", first_name, last_name, address_line1, address_line2, address_line3, town, county, country, postcode, telephone, "resetPasswordToken", "resetPasswordExpires", "failedLoginAttemptCount", "accountLocked", "passwordExpiry", salt, payment_reference, "activationToken", activated, "activationTokenExpires") FROM stdin;
mdaunt@example.com	$2a$10$E/d7IQqCyLPKHulN9V7ypONvpqf8ni/M4cDzafA1aPe7vz4j1zUGa	59	2016-02-08	2016-02-03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	f	2016-08-04 13:55:11.681	$2a$10$E/d7IQqCyLPKHulN9V7ypO	FCO-LOI-REF-31	d093ad095211e086aa497b1c3d6c72dd7e441c70	t	\N
fred@example.com	$2a$10$3IjiYo2LoWZYZ9WV5Ks1YeVKMJNpUnJC2rrWEzE7iW9gcmpURAa0S	61	2016-02-09	2016-02-09	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	f	2016-08-10 10:19:21.561	$2a$10$3IjiYo2LoWZYZ9WV5Ks1Ye	FCO-LOI-REF-33	e312f172c80912c76d84ca803e715474dfeeb161	t	2016-02-10
\.


--
-- TOC entry 1985 (class 0 OID 0)
-- Dependencies: 172
-- Name: next_payment_reference; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('next_payment_reference', 33, true);


--
-- TOC entry 1986 (class 0 OID 0)
-- Dependencies: 170
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('user_id_seq', 61, true);


--
-- TOC entry 1865 (class 2606 OID 63845)
-- Name: user_pk; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace:
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT user_pk PRIMARY KEY (email);

CREATE TABLE "AccountDetails"
(
  id integer,
  complete boolean,
  "updatedAt" date,
  "createdAt" date,
  first_name text,
  last_name text,
  telephone text,
  company_name text,
  company_number text,
  user_id integer,
  CONSTRAINT user_id PRIMARY KEY (user_id)

);

CREATE TABLE "SavedAddress"
(
  id BIGSERIAL PRIMARY KEY,
  user_id integer,
  full_name text,
  house_name text,
  street text,
  town text,
  county text,
  country text,
  postcode text,
  "updatedAt" date,
  "createdAt" date

);


ALTER TABLE "Users"
ADD "premiumEnabled"boolean DEFAULT false;
ALTER TABLE "Users"
ADD "dropOffEnabled" boolean DEFAULT false;

ALTER TABLE "AccountDetails"
ADD "feedback_consent" boolean DEFAULT false;

CREATE OR REPLACE FUNCTION get_next_payment_reference()
  RETURNS text AS
$BODY$

DECLARE
    v_reference TEXT;

BEGIN

SELECT 'FCO-LOI-REF-'||nextval('next_payment_reference')::TEXT
INTO v_reference;

RETURN v_reference;

END;

$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION get_next_payment_reference()
  OWNER TO postgres;


--
-- TOC entry 1982 (class 0 OID 0)
-- Dependencies: 6
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2016-02-10 12:05:44 GMT

--
-- PostgreSQL database dump complete
--

