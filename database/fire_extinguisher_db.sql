--
-- PostgreSQL database dump
--

\restrict 2Z8EmBLtI6lqINaCLe3qumqDmlVYXzh2FPKztSbetan78n8UrzezF6cJj2PGwpH

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extinguisher; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extinguisher;


--
-- Name: inspection; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA inspection;


--
-- Name: notification; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA notification;


--
-- Name: enum_users_role; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.enum_users_role AS ENUM (
    'ADMIN',
    'INSPECTOR',
    'USER'
);


--
-- Name: enum_extinguisher_requests_status; Type: TYPE; Schema: extinguisher; Owner: -
--

CREATE TYPE extinguisher.enum_extinguisher_requests_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'INFO_REQUESTED'
);


--
-- Name: enum_extinguishers_size; Type: TYPE; Schema: extinguisher; Owner: -
--

CREATE TYPE extinguisher.enum_extinguishers_size AS ENUM (
    '1.5_LB',
    '5_LB',
    '9_LB',
    '12_LB'
);


--
-- Name: enum_extinguishers_status; Type: TYPE; Schema: extinguisher; Owner: -
--

CREATE TYPE extinguisher.enum_extinguishers_status AS ENUM (
    'AVAILABLE',
    'ASSIGNED',
    'ACTIVE',
    'INSPECTION_DUE',
    'UNDER_INSPECTION',
    'NEEDS_MAINTENANCE',
    'EXPIRED',
    'REPLACEMENT_REQUIRED',
    'ARCHIVED'
);


--
-- Name: enum_extinguishers_type; Type: TYPE; Schema: extinguisher; Owner: -
--

CREATE TYPE extinguisher.enum_extinguishers_type AS ENUM (
    'WATER',
    'CO2',
    'FOAM',
    'DRY_CHEMICAL'
);


--
-- Name: enum_inspections_result; Type: TYPE; Schema: inspection; Owner: -
--

CREATE TYPE inspection.enum_inspections_result AS ENUM (
    'PASSED',
    'FAILED',
    'NEEDS_MAINTENANCE',
    'EXPIRED',
    'PENDING'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_logs (
    id uuid NOT NULL,
    "actorId" uuid,
    "actorRole" character varying(40),
    action character varying(80) NOT NULL,
    "targetType" character varying(80),
    "targetId" character varying(80),
    "oldValue" jsonb,
    "newValue" jsonb,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "tokenHash" character varying(255) NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    id uuid NOT NULL,
    "firstName" character varying(255) NOT NULL,
    "lastName" character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    "passwordHash" character varying(255) NOT NULL,
    role auth.enum_users_role DEFAULT 'USER'::auth.enum_users_role NOT NULL,
    "isActive" boolean DEFAULT true,
    "resetTokenHash" character varying(255),
    "resetTokenExpiry" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "isVerified" boolean DEFAULT true NOT NULL,
    "otpHash" character varying(255),
    "otpExpiry" timestamp with time zone,
    "otpAttempts" integer DEFAULT 0 NOT NULL
);


--
-- Name: extinguisher_requests; Type: TABLE; Schema: extinguisher; Owner: -
--

CREATE TABLE extinguisher.extinguisher_requests (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "requesterName" character varying(255),
    "requesterEmail" character varying(255),
    quantity integer DEFAULT 1 NOT NULL,
    location character varying(255) NOT NULL,
    reason text,
    status extinguisher.enum_extinguisher_requests_status DEFAULT 'PENDING'::extinguisher.enum_extinguisher_requests_status NOT NULL,
    "requestedAt" timestamp with time zone NOT NULL,
    "reviewedByAdminId" uuid,
    "reviewedAt" timestamp with time zone,
    "adminComment" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: extinguishers; Type: TABLE; Schema: extinguisher; Owner: -
--

CREATE TABLE extinguisher.extinguishers (
    id uuid NOT NULL,
    "serialNumber" character varying(255) NOT NULL,
    location character varying(255),
    type extinguisher.enum_extinguishers_type NOT NULL,
    size extinguisher.enum_extinguishers_size NOT NULL,
    "userId" uuid,
    "assignedUserName" character varying(255),
    "assignedUserEmail" character varying(255),
    "assignedAt" date,
    "installationDate" date,
    "expiryDate" date NOT NULL,
    "createdByAdminId" uuid,
    "lastInspectionDate" date,
    "lastInspectionResult" character varying(255),
    status extinguisher.enum_extinguishers_status DEFAULT 'AVAILABLE'::extinguisher.enum_extinguishers_status NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: inspections; Type: TABLE; Schema: inspection; Owner: -
--

CREATE TABLE inspection.inspections (
    id uuid NOT NULL,
    "extinguisherId" uuid NOT NULL,
    "requestedByUserId" uuid,
    "scheduledByAdminId" uuid,
    "inspectorId" uuid,
    "scheduledDate" date,
    "scheduledTime" character varying(255),
    status character varying(255) DEFAULT 'REQUESTED'::character varying NOT NULL,
    "performedDate" date,
    result inspection.enum_inspections_result DEFAULT 'PENDING'::inspection.enum_inspections_result NOT NULL,
    notes text,
    "issuesFound" text,
    recommendations text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: maintenance_logs; Type: TABLE; Schema: inspection; Owner: -
--

CREATE TABLE inspection.maintenance_logs (
    id uuid NOT NULL,
    "extinguisherId" uuid NOT NULL,
    "inspectionId" uuid,
    "inspectorId" uuid NOT NULL,
    "actionTaken" character varying(255) NOT NULL,
    "maintenanceDate" date NOT NULL,
    "issuesIdentified" text,
    notes text,
    recommendations text,
    "statusAfterMaintenance" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: notification; Owner: -
--

CREATE TABLE notification.notifications (
    id uuid NOT NULL,
    "userId" uuid,
    type character varying(80) NOT NULL,
    title character varying(160) DEFAULT 'System notification'::character varying NOT NULL,
    message text NOT NULL,
    channel character varying(40) DEFAULT 'IN_APP'::character varying NOT NULL,
    status character varying(40) DEFAULT 'SENT'::character varying NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_logs (id, "actorId", "actorRole", action, "targetType", "targetId", "oldValue", "newValue", "createdAt") FROM stdin;
1ea0c926-c6c9-4eb1-9611-e9f802b0689a	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	REQUEST_REVIEWED	extinguisher_request	558948de-cafe-4a2a-a81c-0b0669ac06d1	{"status": "PENDING"}	{"status": "APPROVED", "decision": "APPROVE"}	2026-06-03 13:14:38.17+02
dfb22682-4ec8-4be1-9c8c-3556bcfae909	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ASSIGNED	extinguisher	0e6775ce-cde2-4e2a-97aa-265cf9a6284e	{"status": "AVAILABLE"}	{"status": "ASSIGNED", "userId": "f88e5101-1b13-40a4-ba45-345870631ad7"}	2026-06-03 13:14:38.815+02
bd3da05c-8335-4741-b998-b9becfb1160e	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	REQUEST_REVIEWED	extinguisher_request	f3d5d3a2-c2f2-41ff-896b-c8364cad8f0d	{"status": "PENDING"}	{"status": "APPROVED", "decision": "APPROVE"}	2026-06-03 13:15:43.221+02
6067edd8-c42c-4a9a-8499-cf6a3219080f	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ASSIGNED	extinguisher	8e5cb9b0-8ebf-49e9-819b-ad470f81afbf	{"status": "AVAILABLE"}	{"status": "ASSIGNED", "userId": "f88e5101-1b13-40a4-ba45-345870631ad7"}	2026-06-03 13:15:43.238+02
a30b8652-d212-4c5c-801e-fa328e2cf445	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR	INSPECTION_PERFORMED	inspection	601b7234-6e8c-452c-97df-d8b95cd7df90	{"status": "UNDER_INSPECTION"}	{"result": "NEEDS_MAINTENANCE", "status": "COMPLETED_WITH_ISSUES"}	2026-06-03 13:15:43.421+02
8d13bfac-d8fd-40cf-8e91-60ea538d8bf7	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR	MAINTENANCE_LOGGED	maintenance	656514aa-98ab-4359-9384-25ef67e9ad5f	\N	{"statusAfterMaintenance": "ACTIVE"}	2026-06-03 13:15:43.47+02
fe947e9d-165c-46c1-aac5-0fd0f8d9c8d5	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	REQUEST_REVIEWED	extinguisher_request	a314c5b6-6c76-4e94-8592-12218001dda5	{"status": "PENDING"}	{"status": "APPROVED", "decision": "APPROVE"}	2026-06-03 13:16:30.626+02
4bc8efbd-0de2-4ce6-9cc9-204add57dfe9	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ASSIGNED	extinguisher	6840004e-8e97-44ab-af9a-74b261fe0ccf	{"status": "AVAILABLE"}	{"status": "ASSIGNED", "userId": "f88e5101-1b13-40a4-ba45-345870631ad7"}	2026-06-03 13:16:30.646+02
6f3f62dd-11d9-44c4-8deb-87c18f6d7e25	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_INSTALLED	extinguisher	6840004e-8e97-44ab-af9a-74b261fe0ccf	{"status": "ASSIGNED"}	{"status": "ACTIVE", "installationDate": "2026-06-03"}	2026-06-03 13:16:30.657+02
23e76a96-8a26-4489-a315-c0c74df5ea8e	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR	INSPECTION_PERFORMED	inspection	f069ebcf-45f0-486f-980a-0ad47c1be57f	{"status": "UNDER_INSPECTION"}	{"result": "NEEDS_MAINTENANCE", "status": "COMPLETED_WITH_ISSUES"}	2026-06-03 13:16:30.745+02
23e13392-d35d-4a0e-be38-c43f81d13a9b	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR	MAINTENANCE_LOGGED	maintenance	20c0eb05-3ba0-4c79-b083-a148928e921a	\N	{"statusAfterMaintenance": "ACTIVE"}	2026-06-03 13:16:30.778+02
e61b5d78-fb4c-4bcd-9528-9c6241619776	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ARCHIVED	extinguisher	6840004e-8e97-44ab-af9a-74b261fe0ccf	{"status": "ACTIVE"}	{"status": "ARCHIVED"}	2026-06-03 13:27:25.982+02
c9b1344d-5d64-41a7-8f3a-fadd0e6bbd36	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ARCHIVED	extinguisher	8e5cb9b0-8ebf-49e9-819b-ad470f81afbf	{"status": "ACTIVE"}	{"status": "ARCHIVED"}	2026-06-03 13:27:28.463+02
b5515373-36d5-4717-9b2d-fcbdcb7710e2	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	REQUEST_REVIEWED	extinguisher_request	1d36c95e-4ce5-4d74-988c-87e086b7b8e3	{"status": "PENDING"}	{"status": "APPROVED", "decision": "APPROVE"}	2026-06-03 13:28:19.811+02
7e30069f-a816-4db9-957c-e7806f01e23d	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	REQUEST_REVIEWED	extinguisher_request	6edbd48d-0cd4-4ee8-95c3-003898644734	{"status": "PENDING"}	{"status": "APPROVED", "decision": "APPROVE"}	2026-06-03 13:28:45.324+02
549289d6-aae5-498a-aa4b-16f53de604b9	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	REQUEST_REVIEWED	extinguisher_request	c97943da-1ef2-4cd9-9c29-b0b0f5967cbd	{"status": "PENDING"}	{"status": "APPROVED", "decision": "APPROVE"}	2026-06-03 13:46:50.404+02
2f6f143b-94e4-48f8-bf59-b84335bacf6c	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ASSIGNED	extinguisher	25e2b72b-98c1-4afc-b2ad-4e611b8ff290	{"status": "AVAILABLE"}	{"status": "ASSIGNED", "userId": "de53289c-30a7-4c7c-bed6-ba40f6332994"}	2026-06-03 13:47:12.483+02
56436c64-9de2-4016-a0bc-0d98d6266800	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ASSIGNED	extinguisher	43f4511d-cc09-4cbc-ab7c-d258b9f6b686	{"status": "AVAILABLE"}	{"status": "ASSIGNED", "userId": "de53289c-30a7-4c7c-bed6-ba40f6332994"}	2026-06-03 13:55:24.492+02
8153de6a-9635-4587-92d4-86c53a8171aa	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ASSIGNED	extinguisher	bc0cf294-478c-47c6-8936-612faa920e5a	{"status": "AVAILABLE"}	{"status": "ASSIGNED", "userId": "de53289c-30a7-4c7c-bed6-ba40f6332994"}	2026-06-03 13:55:27.751+02
22136056-fdfd-4261-8942-30badf35e9bd	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR	INSPECTION_PERFORMED	inspection	5c4aea9e-5424-4379-a001-83d5bd0e2d14	{"status": "UNDER_INSPECTION"}	{"result": "PASSED", "status": "COMPLETED"}	2026-06-03 13:57:35.714+02
d7d36be9-245f-4a6b-9ce2-cca014d32877	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	INSPECTION_ASSIGNED	inspection	1f0aba38-2d5a-4afc-8ba4-810b279818cf	{"status": "REQUESTED", "inspectorId": null}	{"status": "SCHEDULED", "inspectorId": "21130ed6-a744-487c-b93a-53967d56f580"}	2026-06-03 13:59:08.653+02
b7e32601-2c66-42a6-8cdc-f5719d92a11f	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	ROLE_CHANGED	user	fbeba116-b88f-4992-9829-a52d6fd6e9bf	{"role": "USER"}	{"role": "INSPECTOR"}	2026-06-03 14:00:30.535+02
284661d1-2507-42e6-878f-8c6c72fca1f8	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	INSPECTION_ASSIGNED	inspection	a4cf812d-6fb7-4383-9044-b9585caf344e	{"status": "REQUESTED", "inspectorId": null}	{"status": "SCHEDULED", "inspectorId": "fbeba116-b88f-4992-9829-a52d6fd6e9bf"}	2026-06-03 14:00:59.079+02
68b97a92-f4e4-4f3b-b701-da7e8fcc928c	fbeba116-b88f-4992-9829-a52d6fd6e9bf	INSPECTOR	INSPECTION_PERFORMED	inspection	a4cf812d-6fb7-4383-9044-b9585caf344e	{"status": "UNDER_INSPECTION"}	{"result": "PASSED", "status": "COMPLETED"}	2026-06-03 14:01:17.872+02
3026785d-f2ce-4e79-adf6-db95fc417a0d	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	USER_DELETED	user	24c76e5b-4c6d-4aa0-87d5-960fb566e735	{"isActive": true}	{"isActive": false}	2026-06-04 10:53:56.393+02
c9a35d64-fffb-4e2a-90c4-5464cb02b3b3	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	USER_DELETED	user	24c76e5b-4c6d-4aa0-87d5-960fb566e735	{"isActive": true}	{"isActive": false}	2026-06-04 10:54:04.965+02
fecd509d-d4f2-426b-a516-3c4fe8af1b78	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ARCHIVED	extinguisher	0e6775ce-cde2-4e2a-97aa-265cf9a6284e	{"status": "ASSIGNED"}	{"status": "ARCHIVED"}	2026-06-04 10:59:53.92+02
b3d43302-c458-4497-ac56-7ff1bc47a01c	d30eee4c-4313-4017-b1d2-77bdc70562f1	ADMIN	EXT_ASSIGNED	extinguisher	a6c9e412-1ecd-432c-bb4e-5b020c4d1514	{"status": "AVAILABLE"}	{"status": "ASSIGNED", "userId": "24c76e5b-4c6d-4aa0-87d5-960fb566e735"}	2026-06-04 11:00:17.059+02
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (id, "userId", "tokenHash", "expiresAt", "createdAt", "updatedAt") FROM stdin;
22430cb0-a314-4857-b711-69ec9e4bb13e	1f7a517f-f27d-4480-98ce-6cc784e19b06	d3f6c4c163b0363c88c65f2088bcceb54500d5b9d2a97cbb5da2158088d34e60	2026-06-10 09:32:33+02	2026-06-03 09:32:33.907+02	2026-06-03 09:32:33.907+02
bd6c340a-586e-4d47-93b1-fe9b229c71b4	1f7a517f-f27d-4480-98ce-6cc784e19b06	4172d566a80bca9fabff05d94aa994a7cd502cde0765e4f9749081af8fe78a51	2026-06-10 09:32:34+02	2026-06-03 09:32:34.083+02	2026-06-03 09:32:34.083+02
ce050f56-a124-46af-825f-feede9b9528c	1f7a517f-f27d-4480-98ce-6cc784e19b06	9dfc3bbde61cf01a04c1a016e950617c49642631d9bd1c0c3c2e1cec6aec3b51	2026-06-10 09:34:14+02	2026-06-03 09:34:14.824+02	2026-06-03 09:34:14.824+02
f6594d0d-bcab-4c1c-956f-a0f022bfa340	1f7a517f-f27d-4480-98ce-6cc784e19b06	027881540e47ef334c1d877827c7411a7631134b1fb2a05a1b0e28d469b27530	2026-06-10 09:37:14+02	2026-06-03 09:37:14.912+02	2026-06-03 09:37:14.912+02
fae3d202-cc5f-44a1-ac3a-59b8d6637655	1f7a517f-f27d-4480-98ce-6cc784e19b06	6f0974769478d2b87faccbd57564d495f7ae1dc0b51d88e60c998c42ffacc303	2026-06-10 09:40:02+02	2026-06-03 09:40:02.795+02	2026-06-03 09:40:02.795+02
61ed00c2-8292-40d4-a652-002af1fba931	1f7a517f-f27d-4480-98ce-6cc784e19b06	8a31668b8c351eb87d9cfb18a02d2875991d33bd372960e956689727c6ac576d	2026-06-10 10:23:37+02	2026-06-03 10:23:37.885+02	2026-06-03 10:23:37.885+02
4451019d-59a3-4cf5-aa32-ed5f1e94f9f3	1f7a517f-f27d-4480-98ce-6cc784e19b06	625253baf308ece0f429dd374a9a5e6f789852be698709d0cde63df2215e8b88	2026-06-10 10:23:47+02	2026-06-03 10:23:47.934+02	2026-06-03 10:23:47.934+02
96492dbc-6d3c-458c-a1f1-3a275658d86c	1f7a517f-f27d-4480-98ce-6cc784e19b06	20485ffa1a68bb545179ab4ca92aa74bf907b9da13d1bb316bc99ccb1179e967	2026-06-10 10:24:01+02	2026-06-03 10:24:01.3+02	2026-06-03 10:24:01.3+02
7ad47933-9ce7-4ff6-a842-8edbaf7ab2e2	1f7a517f-f27d-4480-98ce-6cc784e19b06	20485ffa1a68bb545179ab4ca92aa74bf907b9da13d1bb316bc99ccb1179e967	2026-06-10 10:24:01+02	2026-06-03 10:24:01.385+02	2026-06-03 10:24:01.385+02
74ee0254-71d4-4321-84fe-72fcedfca801	1f7a517f-f27d-4480-98ce-6cc784e19b06	9d6bac10ffac1296f3f4496d4c9e8620b29fcf650849d02c921c9893444c6d45	2026-06-10 10:34:08+02	2026-06-03 10:34:08.793+02	2026-06-03 10:34:08.793+02
63c246c4-c16b-4b22-9569-5ce9eaa74f4c	e196d99d-9a7c-413f-adf4-d5ce21f69775	0326552d6a7f99539fb5b439d662f151739e9faeaf06a3dac36af3236ecb484c	2026-06-10 10:57:43+02	2026-06-03 10:57:43.285+02	2026-06-03 10:57:43.285+02
fd1021ea-167b-40d1-9b45-4bb9e17ca674	e196d99d-9a7c-413f-adf4-d5ce21f69775	0326552d6a7f99539fb5b439d662f151739e9faeaf06a3dac36af3236ecb484c	2026-06-10 10:57:43+02	2026-06-03 10:57:43.428+02	2026-06-03 10:57:43.428+02
c71a855e-41d0-4bbc-a340-f176ad4abbe8	1f7a517f-f27d-4480-98ce-6cc784e19b06	7a4d4378b0755ea144ed353c7d460dbd3c56c2cc6b802ae0e7c1b925b8d5d9bc	2026-06-10 11:08:47+02	2026-06-03 11:08:47.362+02	2026-06-03 11:08:47.362+02
3feb198e-e6f8-46db-b1b2-ce0e734d081f	1f7a517f-f27d-4480-98ce-6cc784e19b06	3ece6f531fec8fbed1aeb635f3bd551196a739fa569afa9dd56dc01d4288fcf0	2026-06-10 11:10:50+02	2026-06-03 11:10:50.316+02	2026-06-03 11:10:50.316+02
8c1443c0-6a6c-46fe-9fc3-1b40553bbabe	d30eee4c-4313-4017-b1d2-77bdc70562f1	a53558761f8e95b95ab02ef098960b18ec940b13e17d73305d4a02f47d2427e5	2026-06-10 13:14:06+02	2026-06-03 13:14:06.398+02	2026-06-03 13:14:06.398+02
344ceef1-7e3c-4cc8-8cf6-8e5873eb3510	f88e5101-1b13-40a4-ba45-345870631ad7	05538b91040a49337c2d0bc5c33f3820a8801a0ada1bcad100eb500d01f4723a	2026-06-10 13:14:17+02	2026-06-03 13:14:17.576+02	2026-06-03 13:14:17.576+02
b5dba653-cf5f-4908-ad48-b102b64d7376	21130ed6-a744-487c-b93a-53967d56f580	787240a1b6afc7ca31acdf24630a1b540c2a91c132d26c7040800802cdc846be	2026-06-10 13:14:17+02	2026-06-03 13:14:17.742+02	2026-06-03 13:14:17.742+02
36c22386-4474-4123-a115-e08bef15f446	d30eee4c-4313-4017-b1d2-77bdc70562f1	34fa454d9d21edd7e8314ca4e44ce3f898e0aa622a5c39e804f4e56cc3561f12	2026-06-10 13:14:36+02	2026-06-03 13:14:36.894+02	2026-06-03 13:14:36.894+02
5e297f68-e609-412a-9ad8-fa21c4129dc5	f88e5101-1b13-40a4-ba45-345870631ad7	b5b824867d2af0a07731d34fc7c8b6dee1c7a5a911a12a072ac52b48f37b3aa3	2026-06-10 13:14:37+02	2026-06-03 13:14:37.075+02	2026-06-03 13:14:37.075+02
10f55b90-bed5-4392-8751-38f8fd27a816	d30eee4c-4313-4017-b1d2-77bdc70562f1	403b5daa576ce1dba60cf7aff35ef8f2b4c4ec86c763a19b8097df63b47732aa	2026-06-10 13:15:42+02	2026-06-03 13:15:42.772+02	2026-06-03 13:15:42.772+02
21606d9a-0122-4246-84cf-c3e3ec369f81	f88e5101-1b13-40a4-ba45-345870631ad7	b8f57966d24c044d0282f23e7f3c54fe6adee7b5c43cdfb5323a0b16fe6a4071	2026-06-10 13:15:42+02	2026-06-03 13:15:42.851+02	2026-06-03 13:15:42.851+02
98fb7829-30ac-4255-98b1-0d71c4e41b8a	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	b4c368cb1db6eb23a92609a7da17dff59934bc78d6e701ee5e729aa4198479df	2026-06-10 13:15:42+02	2026-06-03 13:15:42.921+02	2026-06-03 13:15:42.921+02
65726cca-4bbd-488a-98c4-aea60caa1ea8	d30eee4c-4313-4017-b1d2-77bdc70562f1	9cc3cf86ed63b9acad9ef45a51c0b24425b007591ef8a3595f22cd80a7bf21eb	2026-06-10 13:16:12+02	2026-06-03 13:16:12.678+02	2026-06-03 13:16:12.678+02
33ece1d3-d0ac-47a9-af86-096b95524657	f88e5101-1b13-40a4-ba45-345870631ad7	8847607fc1096de9a8ef28f53c218fbe6d895afac2581411f7d22339a52faa66	2026-06-10 13:16:12+02	2026-06-03 13:16:12.753+02	2026-06-03 13:16:12.753+02
d7857e49-b312-4335-9c39-ce55a0909c6f	d30eee4c-4313-4017-b1d2-77bdc70562f1	492d62bec28603ed34bf46381a197651131d30a0f1d099af169a962edcab61c6	2026-06-10 13:16:30+02	2026-06-03 13:16:30.232+02	2026-06-03 13:16:30.232+02
b28541cb-e636-4339-8149-0973dad07ce3	f88e5101-1b13-40a4-ba45-345870631ad7	2dff0627a7f09d4ac5fe62f58845a498308cf7827fcdff972493038680314831	2026-06-10 13:16:30+02	2026-06-03 13:16:30.301+02	2026-06-03 13:16:30.301+02
755dc882-5cc3-4c2a-ab31-1ca1dd4f4497	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	4084452b4c691464cba68015bffb6f8b4be4245b314a3f292ce0dfe56e615b30	2026-06-10 13:16:30+02	2026-06-03 13:16:30.371+02	2026-06-03 13:16:30.371+02
744ffdb2-4b14-49ff-981c-a363bae3a7c5	d30eee4c-4313-4017-b1d2-77bdc70562f1	6ccf5c4ca06859d31e75d0b510bbdfafc9e5e9d912ecae68a9bbc3310673d0d7	2026-06-10 13:52:53+02	2026-06-03 13:52:53.958+02	2026-06-03 13:52:53.958+02
34808d5e-9830-433e-b493-da4e00bc2e4c	d30eee4c-4313-4017-b1d2-77bdc70562f1	fbb8d8553931cacd5f5f9007b14053a052b9b643917c59ea1741bbc8c0b4a9bf	2026-06-10 13:52:54+02	2026-06-03 13:52:54.148+02	2026-06-03 13:52:54.148+02
2af73341-8299-4f03-8b63-2e53ff1da546	d30eee4c-4313-4017-b1d2-77bdc70562f1	fbb8d8553931cacd5f5f9007b14053a052b9b643917c59ea1741bbc8c0b4a9bf	2026-06-10 13:52:54+02	2026-06-03 13:52:54.44+02	2026-06-03 13:52:54.44+02
e05f525a-6d15-4c03-baeb-0a43fc5f1edf	d30eee4c-4313-4017-b1d2-77bdc70562f1	fbb8d8553931cacd5f5f9007b14053a052b9b643917c59ea1741bbc8c0b4a9bf	2026-06-10 13:52:54+02	2026-06-03 13:52:54.669+02	2026-06-03 13:52:54.669+02
66461400-e205-4d61-9221-903e7581269f	d30eee4c-4313-4017-b1d2-77bdc70562f1	fbb8d8553931cacd5f5f9007b14053a052b9b643917c59ea1741bbc8c0b4a9bf	2026-06-10 13:52:54+02	2026-06-03 13:52:54.803+02	2026-06-03 13:52:54.803+02
855716d4-af0e-427a-9059-cc9b54d4bf90	d30eee4c-4313-4017-b1d2-77bdc70562f1	fbb8d8553931cacd5f5f9007b14053a052b9b643917c59ea1741bbc8c0b4a9bf	2026-06-10 13:52:54+02	2026-06-03 13:52:54.949+02	2026-06-03 13:52:54.949+02
c6dfb680-257a-44a8-a2c6-d3f93e5ac57c	d30eee4c-4313-4017-b1d2-77bdc70562f1	5485f79f502abe18c1743d15800d5909eb7bba29f06a9fd895f5c5573ab7289e	2026-06-10 13:52:55+02	2026-06-03 13:52:55.108+02	2026-06-03 13:52:55.108+02
f1331f73-3623-40d2-a11f-3e246d5e9e04	d30eee4c-4313-4017-b1d2-77bdc70562f1	5485f79f502abe18c1743d15800d5909eb7bba29f06a9fd895f5c5573ab7289e	2026-06-10 13:52:55+02	2026-06-03 13:52:55.246+02	2026-06-03 13:52:55.246+02
d18efc38-fdd1-4f42-a882-f624f5005268	d30eee4c-4313-4017-b1d2-77bdc70562f1	5485f79f502abe18c1743d15800d5909eb7bba29f06a9fd895f5c5573ab7289e	2026-06-10 13:52:55+02	2026-06-03 13:52:55.377+02	2026-06-03 13:52:55.377+02
af3fd61f-5cfa-41c5-8e8e-0e621beffe96	d30eee4c-4313-4017-b1d2-77bdc70562f1	5485f79f502abe18c1743d15800d5909eb7bba29f06a9fd895f5c5573ab7289e	2026-06-10 13:52:55+02	2026-06-03 13:52:55.551+02	2026-06-03 13:52:55.551+02
918340a4-bcd0-4823-a3af-053e3d99669a	d30eee4c-4313-4017-b1d2-77bdc70562f1	a4b617499d299a5034bd944a7e017d06f9136cf7d0942215581386c516374db9	2026-06-10 13:53:48+02	2026-06-03 13:53:48.221+02	2026-06-03 13:53:48.221+02
57134c45-784f-4bfb-9b6a-d60b01b02ee9	d30eee4c-4313-4017-b1d2-77bdc70562f1	a4b617499d299a5034bd944a7e017d06f9136cf7d0942215581386c516374db9	2026-06-10 13:53:48+02	2026-06-03 13:53:48.366+02	2026-06-03 13:53:48.366+02
933e2db7-7070-4254-852e-977589c509cd	d30eee4c-4313-4017-b1d2-77bdc70562f1	a4b617499d299a5034bd944a7e017d06f9136cf7d0942215581386c516374db9	2026-06-10 13:53:48+02	2026-06-03 13:53:48.53+02	2026-06-03 13:53:48.53+02
7b348b6b-4e38-42b2-86c1-2a84594a9aaa	d30eee4c-4313-4017-b1d2-77bdc70562f1	a4b617499d299a5034bd944a7e017d06f9136cf7d0942215581386c516374db9	2026-06-10 13:53:48+02	2026-06-03 13:53:48.668+02	2026-06-03 13:53:48.668+02
73218632-da8e-41e9-a4a1-49cd96d947ff	d30eee4c-4313-4017-b1d2-77bdc70562f1	a4b617499d299a5034bd944a7e017d06f9136cf7d0942215581386c516374db9	2026-06-10 13:53:48+02	2026-06-03 13:53:48.8+02	2026-06-03 13:53:48.8+02
5e493704-9971-40e3-8d9e-04134833c9c3	d30eee4c-4313-4017-b1d2-77bdc70562f1	a4b617499d299a5034bd944a7e017d06f9136cf7d0942215581386c516374db9	2026-06-10 13:53:48+02	2026-06-03 13:53:48.938+02	2026-06-03 13:53:48.938+02
5223274c-409a-4a6d-b2e3-6c34424d4318	d30eee4c-4313-4017-b1d2-77bdc70562f1	bfab7f4aee2fd6484eff93a8031a8f906a5a2f68ab97cdbe24f0c67f8356bd93	2026-06-10 13:53:49+02	2026-06-03 13:53:49.12+02	2026-06-03 13:53:49.12+02
274dc3d8-8645-495e-add4-4050c39b8f87	d30eee4c-4313-4017-b1d2-77bdc70562f1	bfab7f4aee2fd6484eff93a8031a8f906a5a2f68ab97cdbe24f0c67f8356bd93	2026-06-10 13:53:49+02	2026-06-03 13:53:49.259+02	2026-06-03 13:53:49.259+02
4c8a12ec-6e1b-4653-8c96-60edf671c739	d30eee4c-4313-4017-b1d2-77bdc70562f1	bfab7f4aee2fd6484eff93a8031a8f906a5a2f68ab97cdbe24f0c67f8356bd93	2026-06-10 13:53:49+02	2026-06-03 13:53:49.377+02	2026-06-03 13:53:49.377+02
6a536040-90cd-4f77-9f9b-20da0b95c8c2	d30eee4c-4313-4017-b1d2-77bdc70562f1	bfab7f4aee2fd6484eff93a8031a8f906a5a2f68ab97cdbe24f0c67f8356bd93	2026-06-10 13:53:49+02	2026-06-03 13:53:49.488+02	2026-06-03 13:53:49.488+02
fe8dd502-98c9-4818-b758-1d8a53664cb8	d30eee4c-4313-4017-b1d2-77bdc70562f1	bfab7f4aee2fd6484eff93a8031a8f906a5a2f68ab97cdbe24f0c67f8356bd93	2026-06-10 13:53:49+02	2026-06-03 13:53:49.622+02	2026-06-03 13:53:49.622+02
7b08069a-d814-4719-8b74-f6213acbc1f2	d30eee4c-4313-4017-b1d2-77bdc70562f1	bfab7f4aee2fd6484eff93a8031a8f906a5a2f68ab97cdbe24f0c67f8356bd93	2026-06-10 13:53:49+02	2026-06-03 13:53:49.756+02	2026-06-03 13:53:49.756+02
56956fbc-7563-424a-b8a9-eac510984147	fbeba116-b88f-4992-9829-a52d6fd6e9bf	2beacce29ff2fc320f49d90ffc7678c6bedd31662474f21b9f2f41b028cf1806	2026-06-10 14:01:09+02	2026-06-03 14:01:09.978+02	2026-06-03 14:01:09.978+02
19dad266-d9ad-4a6b-88db-eee1dc051d48	d30eee4c-4313-4017-b1d2-77bdc70562f1	9d2f101f9395f39d647e5290fe95fecd95600aa4dbd124c4553a2b9339d89511	2026-06-11 10:33:14+02	2026-06-04 10:33:14.289+02	2026-06-04 10:33:14.289+02
f75cc401-846b-4177-93a3-6d73bd8067e2	24c76e5b-4c6d-4aa0-87d5-960fb566e735	728aafacfe5d06cce3f788d5a981313fa0d34a3dc33dfe5a153d7f002899cc16	2026-06-11 10:47:29+02	2026-06-04 10:47:29.966+02	2026-06-04 10:47:29.966+02
e6dcb9f9-9f0f-4b3d-a395-b40245ed41f1	d30eee4c-4313-4017-b1d2-77bdc70562f1	9ce00ecae7f69bc340d151f88278ac8acadb53426b15615fbd853fc8011894a5	2026-06-11 10:51:06+02	2026-06-04 10:51:06.722+02	2026-06-04 10:51:06.722+02
bddea328-6307-4ac7-9357-832c0d134611	d30eee4c-4313-4017-b1d2-77bdc70562f1	a0680538b398d49d50aa5c4a332fce73468d103cc321c156e8895335b6adf12e	2026-06-11 11:03:04+02	2026-06-04 11:03:04.85+02	2026-06-04 11:03:04.85+02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (id, "firstName", "lastName", email, "passwordHash", role, "isActive", "resetTokenHash", "resetTokenExpiry", "createdAt", "updatedAt", "isVerified", "otpHash", "otpExpiry", "otpAttempts") FROM stdin;
d30eee4c-4313-4017-b1d2-77bdc70562f1	TZW	Admin	admin@tzw.rw	$2a$10$QADEoOhYQouPuWTU5IbcOeMhHm4RBWG5OYpD8FgfobF4FG8pdBwF6	ADMIN	t	\N	\N	2026-06-03 13:13:56.797+02	2026-06-03 13:13:56.797+02	t	\N	\N	0
21130ed6-a744-487c-b93a-53967d56f580	Jean	Mugisha	inspector1@tzw.rw	$2a$10$Akg1zXDlIbTJRCKGMWqji.rsks42j3EuF26kwMf0Te0hm8lVgR6ce	INSPECTOR	t	\N	\N	2026-06-03 13:13:56.809+02	2026-06-03 13:13:56.809+02	t	\N	\N	0
4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	Alice	Uwase	inspector2@tzw.rw	$2a$10$Akg1zXDlIbTJRCKGMWqji.rsks42j3EuF26kwMf0Te0hm8lVgR6ce	INSPECTOR	t	\N	\N	2026-06-03 13:13:56.809+02	2026-06-03 13:13:56.809+02	t	\N	\N	0
cbccb66b-f144-44ec-b144-1f427d890c07	Eric	Niyonzima	inspector3@tzw.rw	$2a$10$Akg1zXDlIbTJRCKGMWqji.rsks42j3EuF26kwMf0Te0hm8lVgR6ce	INSPECTOR	t	\N	\N	2026-06-03 13:13:56.809+02	2026-06-03 13:13:56.809+02	t	\N	\N	0
f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights	Ltd	company@tzw.rw	$2a$10$yM5V.UxR/Qgn2V5pkgiWPuf5xbNftSmOJF/WFC9QA4GavgWGi/qL6	USER	t	\N	\N	2026-06-03 13:13:56.815+02	2026-06-03 13:13:56.815+02	t	\N	\N	0
e27f696b-6c41-4344-9d5a-5f3c842207cd	Green Hills	Academy	school@tzw.rw	$2a$10$yM5V.UxR/Qgn2V5pkgiWPuf5xbNftSmOJF/WFC9QA4GavgWGi/qL6	USER	t	\N	\N	2026-06-03 13:13:56.815+02	2026-06-03 13:13:56.815+02	t	\N	\N	0
1bf5b07c-1058-4fea-befa-802cadf35700	Damas	Pharmacy	damas@tzw.rw	$2a$10$yM5V.UxR/Qgn2V5pkgiWPuf5xbNftSmOJF/WFC9QA4GavgWGi/qL6	USER	t	\N	\N	2026-06-03 13:13:56.815+02	2026-06-03 13:13:56.815+02	t	\N	\N	0
2ba5156d-df2f-43ae-8e39-3194cb7229c6	Serena Hotel	Kigali	hotel@tzw.rw	$2a$10$yM5V.UxR/Qgn2V5pkgiWPuf5xbNftSmOJF/WFC9QA4GavgWGi/qL6	USER	t	\N	\N	2026-06-03 13:13:56.815+02	2026-06-03 13:13:56.815+02	t	\N	\N	0
de53289c-30a7-4c7c-bed6-ba40f6332994	sna	kail	snakail340@gmail.com	$2a$10$u31NBLQniqp0BIfut74cFuwtBt5REQoIOgGLlz1uGn10A4QjbvA3u	USER	t	\N	\N	2026-06-03 13:43:54.126+02	2026-06-03 13:45:52.666+02	t	\N	\N	0
fbeba116-b88f-4992-9829-a52d6fd6e9bf	faith	mico	faith@gmail.com	$2a$10$4esuUGBNOds6cJSX4VIYquAAbizkHVRpA7T0NSw9x9SMkEcgEvjB.	INSPECTOR	t	\N	\N	2026-06-03 14:00:14.675+02	2026-06-03 14:00:30.524+02	t	\N	\N	0
24c76e5b-4c6d-4aa0-87d5-960fb566e735	sna	kail	kagabolucky72@gmail.com	$2a$10$/686uLphMefBbYaDSYZ3MOTQ6lLyjvUhao.eahfgxMI4uhPALVcgC	USER	f	\N	\N	2026-06-04 10:47:29.945+02	2026-06-04 10:53:56.357+02	t	\N	\N	0
b2e24419-9865-4e2a-9b20-f29faee5c5c0	Otp	Check	otpcheck_21968@example.com	$2a$10$Ds0dElVmZeW8jwTSmT.4C.EWkTH89klNKpB6LP.GQSEDHvE5kjJeK	USER	t	\N	\N	2026-06-04 10:54:15.292+02	2026-06-04 10:54:15.297+02	f	6dac433091a1b75062322780317de1408f86c78bff54ebc75d251889afc54c24	2026-06-04 11:04:15.296+02	0
15c4b7ad-078a-4cf7-bcb3-df4d18ff12ed	Kagabo	lucky	awet.fesseha@rca.ac.rw	$2a$10$EZQBSZVoQlGom1QQ3Mgpju9NNj4EiKjXWlkzkatyxtvYdsttkpOca	USER	t	\N	\N	2026-06-04 11:01:27.277+02	2026-06-04 11:02:32.225+02	t	\N	\N	0
\.


--
-- Data for Name: extinguisher_requests; Type: TABLE DATA; Schema: extinguisher; Owner: -
--

COPY extinguisher.extinguisher_requests (id, "userId", "requesterName", "requesterEmail", quantity, location, reason, status, "requestedAt", "reviewedByAdminId", "reviewedAt", "adminComment", "createdAt", "updatedAt") FROM stdin;
35d7b1c8-abcf-4b38-90a0-31f48814a0cc	2ba5156d-df2f-43ae-8e39-3194cb7229c6	Serena Hotel Kigali	hotel@tzw.rw	2	Serena — Kitchen	Kitchen expansion	APPROVED	2026-05-24 02:00:00+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-05-26 02:00:00+02	Approved, stock allocated.	2026-06-03 13:13:56.826+02	2026-06-03 13:13:56.826+02
ed371d07-2f69-4a4c-8179-1f5beb3f15e5	1bf5b07c-1058-4fea-befa-802cadf35700	Damas Pharmacy	damas@tzw.rw	1	Damas — Storage	Replace old unit	REJECTED	2026-05-22 02:00:00+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-05-23 02:00:00+02	Existing unit still compliant.	2026-06-03 13:13:56.826+02	2026-06-03 13:13:56.826+02
be6bac3e-277c-4913-a20c-d25c4149bed8	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	company@tzw.rw	4	Kigali Heights — Parking	Garage coverage	INFO_REQUESTED	2026-05-29 02:00:00+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-05-30 02:00:00+02	Please confirm parking level count.	2026-06-03 13:13:56.826+02	2026-06-03 13:13:56.826+02
558948de-cafe-4a2a-a81c-0b0669ac06d1	f88e5101-1b13-40a4-ba45-345870631ad7	company@tzw.rw	company@tzw.rw	1	Test Lobby	smoke test	APPROVED	2026-06-03 13:14:37.622+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03 13:14:38.151+02	ok	2026-06-03 13:14:37.623+02	2026-06-03 13:14:38.152+02
f3d5d3a2-c2f2-41ff-896b-c8364cad8f0d	f88e5101-1b13-40a4-ba45-345870631ad7	company@tzw.rw	company@tzw.rw	1	Smoke Lobby	smoke	APPROVED	2026-06-03 13:15:43.15+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03 13:15:43.217+02	ok	2026-06-03 13:15:43.151+02	2026-06-03 13:15:43.217+02
a314c5b6-6c76-4e94-8592-12218001dda5	f88e5101-1b13-40a4-ba45-345870631ad7	company@tzw.rw	company@tzw.rw	1	Smoke Lobby	smoke	APPROVED	2026-06-03 13:16:30.55+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03 13:16:30.622+02	ok	2026-06-03 13:16:30.551+02	2026-06-03 13:16:30.622+02
1d36c95e-4ce5-4d74-988c-87e086b7b8e3	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	company@tzw.rw	3	Kigali Heights — Tower B Lobby	New floor opening	APPROVED	2026-06-02 02:00:00+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03 13:28:19.801+02		2026-06-03 13:13:56.826+02	2026-06-03 13:28:19.801+02
6edbd48d-0cd4-4ee8-95c3-003898644734	e27f696b-6c41-4344-9d5a-5f3c842207cd	Green Hills Academy	school@tzw.rw	5	Green Hills — Science Block	Lab safety upgrade	APPROVED	2026-06-01 02:00:00+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03 13:28:45.314+02		2026-06-03 13:13:56.826+02	2026-06-03 13:28:45.314+02
c97943da-1ef2-4cd9-9c29-b0b0f5967cbd	de53289c-30a7-4c7c-bed6-ba40f6332994	snakail340@gmail.com	snakail340@gmail.com	7	Gasabo apacope	we are launching a new school	APPROVED	2026-06-03 13:44:39.724+02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03 13:46:50.392+02		2026-06-03 13:44:39.725+02	2026-06-03 13:46:50.392+02
\.


--
-- Data for Name: extinguishers; Type: TABLE DATA; Schema: extinguisher; Owner: -
--

COPY extinguisher.extinguishers (id, "serialNumber", location, type, size, "userId", "assignedUserName", "assignedUserEmail", "assignedAt", "installationDate", "expiryDate", "createdByAdminId", "lastInspectionDate", "lastInspectionResult", status, "createdAt", "updatedAt") FROM stdin;
8e66f1d5-4318-4b2d-8f6b-b86ac5dbf41c	FE-2026-KGL-0005	Serena Hotel Kigali — Zone 5	WATER	1.5_LB	2ba5156d-df2f-43ae-8e39-3194cb7229c6	Serena Hotel Kigali	hotel@tzw.rw	2026-05-30	\N	2031-06-03	d30eee4c-4313-4017-b1d2-77bdc70562f1	\N	\N	ASSIGNED	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
0a463f5d-b16c-400c-afda-d2272bd82abc	FE-2026-KGL-0006	Kigali Heights Ltd — Zone 1	CO2	5_LB	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	company@tzw.rw	2025-11-15	2025-11-20	2027-07-08	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-04-04	PASSED	ACTIVE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
9a8fddac-63d5-4a5a-805d-1d2580cafd1c	FE-2026-KGL-0007	Green Hills Academy — Zone 2	FOAM	9_LB	e27f696b-6c41-4344-9d5a-5f3c842207cd	Green Hills Academy	school@tzw.rw	2025-11-14	2025-11-19	2026-07-03	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-03-30	PASSED	ACTIVE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
0434082c-ce51-4c4c-ab82-5de7910c810f	FE-2026-KGL-0008	Damas Pharmacy — Zone 3	DRY_CHEMICAL	12_LB	1bf5b07c-1058-4fea-befa-802cadf35700	Damas Pharmacy	damas@tzw.rw	2025-11-13	2025-11-18	2026-08-02	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-03-25	PASSED	ACTIVE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
424c595a-3354-458f-b0b5-59681593a52e	FE-2026-KGL-0009	Serena Hotel Kigali — Zone 4	WATER	1.5_LB	2ba5156d-df2f-43ae-8e39-3194cb7229c6	Serena Hotel Kigali	hotel@tzw.rw	2025-11-12	2025-11-17	2026-09-01	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-03-20	PASSED	ACTIVE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
9d9b3e12-657a-4e8a-94c7-17584a942739	FE-2026-KGL-0010	Kigali Heights Ltd — Zone 5	CO2	5_LB	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	company@tzw.rw	2025-11-11	2025-11-16	2028-08-11	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-03-15	PASSED	ACTIVE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
ef268494-5c2d-4650-a32f-0313d3792d94	FE-2026-KGL-0011	Green Hills Academy — Zone 1	FOAM	9_LB	e27f696b-6c41-4344-9d5a-5f3c842207cd	Green Hills Academy	school@tzw.rw	2025-11-10	2025-11-15	2026-06-28	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-03-10	PASSED	ACTIVE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
cbaa4bbb-d30c-4294-ae79-97366dcc7560	FE-2026-KGL-0012	Serena Hotel Kigali — Zone 2	DRY_CHEMICAL	12_LB	2ba5156d-df2f-43ae-8e39-3194cb7229c6	Serena Hotel Kigali	hotel@tzw.rw	2025-11-09	2025-11-14	2026-12-20	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-03-05	PASSED	ACTIVE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
4181162f-3b0e-44aa-8e4b-b53cb15fa392	FE-2026-KGL-0013	Green Hills Academy — Zone 3	WATER	1.5_LB	e27f696b-6c41-4344-9d5a-5f3c842207cd	Green Hills Academy	school@tzw.rw	2024-03-25	2024-04-04	2026-05-24	d30eee4c-4313-4017-b1d2-77bdc70562f1	2025-11-15	EXPIRED	EXPIRED	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
3da4caf2-74bb-44c8-acac-d670277f4c12	FE-2026-KGL-0014	Damas Pharmacy — Zone 4	CO2	5_LB	1bf5b07c-1058-4fea-befa-802cadf35700	Damas Pharmacy	damas@tzw.rw	2024-03-25	2024-04-04	2026-05-19	d30eee4c-4313-4017-b1d2-77bdc70562f1	2025-11-15	EXPIRED	EXPIRED	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
f108f9ea-1e47-40af-ae95-116c9dafee88	FE-2026-KGL-0015	Serena Hotel Kigali — Zone 5	FOAM	9_LB	2ba5156d-df2f-43ae-8e39-3194cb7229c6	Serena Hotel Kigali	hotel@tzw.rw	2025-08-07	2025-08-17	2027-03-30	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-05-14	NEEDS_MAINTENANCE	NEEDS_MAINTENANCE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
dd053bd6-5c98-4951-a8d8-817c2e8067a3	FE-2026-KGL-0016	Kigali Heights Ltd — Zone 1	DRY_CHEMICAL	12_LB	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	company@tzw.rw	2025-08-07	2025-08-17	2027-04-29	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-05-14	NEEDS_MAINTENANCE	NEEDS_MAINTENANCE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
8f3ce8c5-f108-4b33-8f37-f3f200950702	FE-2026-KGL-0017	Damas Pharmacy — Zone 2	WATER	1.5_LB	1bf5b07c-1058-4fea-befa-802cadf35700	Damas Pharmacy	damas@tzw.rw	2025-08-07	2025-08-17	2027-05-29	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-05-14	NEEDS_MAINTENANCE	NEEDS_MAINTENANCE	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
33ff33f7-844e-4363-af0d-2d691f72cc24	FE-2026-KGL-0018	Green Hills Academy — Zone 3	CO2	5_LB	e27f696b-6c41-4344-9d5a-5f3c842207cd	Green Hills Academy	school@tzw.rw	2024-10-11	2024-10-21	2026-10-31	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-05-19	NEEDS_MAINTENANCE	REPLACEMENT_REQUIRED	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
5fd85cb8-bab3-4917-8f2a-750ed59f5b0d	FE-2026-KGL-0019	Kigali Heights Ltd — Zone 4	FOAM	9_LB	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	company@tzw.rw	2025-09-26	2025-10-06	2027-10-16	d30eee4c-4313-4017-b1d2-77bdc70562f1	2025-06-03	PASSED	UNDER_INSPECTION	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
64bf51fe-05cb-4fea-9a80-477244018398	FE-2026-KGL-0020	Damas Pharmacy — Zone 5	DRY_CHEMICAL	12_LB	1bf5b07c-1058-4fea-befa-802cadf35700	Damas Pharmacy	damas@tzw.rw	2026-06-02	\N	2031-06-03	d30eee4c-4313-4017-b1d2-77bdc70562f1	\N	\N	ASSIGNED	2026-06-03 13:13:56.817+02	2026-06-03 13:13:56.817+02
6840004e-8e97-44ab-af9a-74b261fe0ccf	FE-SMOKE-1780485390626	\N	CO2	5_LB	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	\N	2026-06-03	2026-06-03	2031-05-08	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03	PASSED	ARCHIVED	2026-06-03 13:16:30.632+02	2026-06-03 13:27:25.943+02
8e5cb9b0-8ebf-49e9-819b-ad470f81afbf	FE-SMOKE-1780485343220	\N	CO2	5_LB	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	\N	2026-06-03	\N	2031-05-08	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03	PASSED	ARCHIVED	2026-06-03 13:15:43.225+02	2026-06-03 13:27:28.455+02
25e2b72b-98c1-4afc-b2ad-4e611b8ff290	FE-2026-KGL-0003	\N	FOAM	9_LB	de53289c-30a7-4c7c-bed6-ba40f6332994	\N	\N	2026-06-03	\N	2031-06-03	d30eee4c-4313-4017-b1d2-77bdc70562f1	\N	\N	ASSIGNED	2026-06-03 13:13:56.817+02	2026-06-03 13:47:12.472+02
43f4511d-cc09-4cbc-ab7c-d258b9f6b686	FE-2026-KGL-0001	\N	WATER	1.5_LB	de53289c-30a7-4c7c-bed6-ba40f6332994	\N	\N	2026-06-03	\N	2031-06-03	d30eee4c-4313-4017-b1d2-77bdc70562f1	\N	\N	ASSIGNED	2026-06-03 13:13:56.817+02	2026-06-03 13:55:24.484+02
bc0cf294-478c-47c6-8936-612faa920e5a	FE-2026-KGL-0002	\N	CO2	5_LB	de53289c-30a7-4c7c-bed6-ba40f6332994	\N	\N	2026-06-03	\N	2031-06-03	d30eee4c-4313-4017-b1d2-77bdc70562f1	\N	\N	ASSIGNED	2026-06-03 13:13:56.817+02	2026-06-03 13:55:27.745+02
9b5056e5-dce1-4445-85de-eec23f53b7d7	FE-2026-KGL-0004	Kigali Heights Ltd — Zone 4	DRY_CHEMICAL	12_LB	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	company@tzw.rw	2026-06-01	\N	2031-06-03	d30eee4c-4313-4017-b1d2-77bdc70562f1	2026-06-03	PASSED	ACTIVE	2026-06-03 13:13:56.817+02	2026-06-03 14:01:17.859+02
0e6775ce-cde2-4e2a-97aa-265cf9a6284e	FE-SMOKE-0001	\N	CO2	5_LB	f88e5101-1b13-40a4-ba45-345870631ad7	Kigali Heights Ltd	\N	2026-06-03	\N	2031-06-03	d30eee4c-4313-4017-b1d2-77bdc70562f1	\N	\N	ARCHIVED	2026-06-03 13:14:38.375+02	2026-06-04 10:59:53.896+02
a6c9e412-1ecd-432c-bb4e-5b020c4d1514	FE-2026-KGL-009	Gasabo	CO2	5_LB	24c76e5b-4c6d-4aa0-87d5-960fb566e735	\N	\N	2026-06-04	\N	2026-11-30	d30eee4c-4313-4017-b1d2-77bdc70562f1	\N	\N	ASSIGNED	2026-06-04 10:59:38.263+02	2026-06-04 11:00:17.046+02
\.


--
-- Data for Name: inspections; Type: TABLE DATA; Schema: inspection; Owner: -
--

COPY inspection.inspections (id, "extinguisherId", "requestedByUserId", "scheduledByAdminId", "inspectorId", "scheduledDate", "scheduledTime", status, "performedDate", result, notes, "issuesFound", recommendations, "createdAt", "updatedAt") FROM stdin;
8e9dea0e-adeb-477c-a666-eef7c8fcf9c4	9a8fddac-63d5-4a5a-805d-1d2580cafd1c	e27f696b-6c41-4344-9d5a-5f3c842207cd	\N	\N	2026-06-10	11:00	REQUESTED	\N	PENDING	\N	\N	\N	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
369f872c-3165-426c-a1d0-765de55d424f	8e66f1d5-4318-4b2d-8f6b-b86ac5dbf41c	2ba5156d-df2f-43ae-8e39-3194cb7229c6	d30eee4c-4313-4017-b1d2-77bdc70562f1	21130ed6-a744-487c-b93a-53967d56f580	2026-06-06	10:00	SCHEDULED	\N	PENDING	\N	\N	\N	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
57457de4-ff27-4e49-9da7-04daa960c8b6	0434082c-ce51-4c4c-ab82-5de7910c810f	1bf5b07c-1058-4fea-befa-802cadf35700	d30eee4c-4313-4017-b1d2-77bdc70562f1	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	2026-06-07	14:00	SCHEDULED	\N	PENDING	\N	\N	\N	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
0bed76d9-84bc-45b3-9c8c-f24143f4dfa5	5fd85cb8-bab3-4917-8f2a-750ed59f5b0d	f88e5101-1b13-40a4-ba45-345870631ad7	d30eee4c-4313-4017-b1d2-77bdc70562f1	cbccb66b-f144-44ec-b144-1f427d890c07	2026-06-03	08:30	UNDER_INSPECTION	\N	PENDING	\N	\N	\N	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
bef639ab-cf47-433f-b757-3859a0305ed9	0a463f5d-b16c-400c-afda-d2272bd82abc	f88e5101-1b13-40a4-ba45-345870631ad7	d30eee4c-4313-4017-b1d2-77bdc70562f1	21130ed6-a744-487c-b93a-53967d56f580	2026-05-04	09:00	COMPLETED	2026-05-04	PASSED	All good.	\N	\N	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
090ee73a-f73f-44fb-bdcf-3f555644bed2	ef268494-5c2d-4650-a32f-0313d3792d94	e27f696b-6c41-4344-9d5a-5f3c842207cd	d30eee4c-4313-4017-b1d2-77bdc70562f1	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	2026-04-19	13:00	COMPLETED	2026-04-19	PASSED	\N	\N	\N	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
cbcbdae8-5b40-4d6b-b2da-33ecb7711e50	f108f9ea-1e47-40af-ae95-116c9dafee88	2ba5156d-df2f-43ae-8e39-3194cb7229c6	d30eee4c-4313-4017-b1d2-77bdc70562f1	cbccb66b-f144-44ec-b144-1f427d890c07	2026-05-14	15:00	COMPLETED_WITH_ISSUES	2026-05-14	NEEDS_MAINTENANCE	\N	Low pressure gauge reading.	Recharge and re-test.	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
153f0cb5-388b-4dc3-8a9a-509ad6ae31f2	dd053bd6-5c98-4951-a8d8-817c2e8067a3	f88e5101-1b13-40a4-ba45-345870631ad7	d30eee4c-4313-4017-b1d2-77bdc70562f1	21130ed6-a744-487c-b93a-53967d56f580	2026-05-16	10:30	COMPLETED_WITH_ISSUES	2026-05-16	FAILED	\N	Corroded nozzle.	Replace nozzle assembly.	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
6d452242-be80-4deb-928a-3f1f5c0aeccc	8e66f1d5-4318-4b2d-8f6b-b86ac5dbf41c	2ba5156d-df2f-43ae-8e39-3194cb7229c6	d30eee4c-4313-4017-b1d2-77bdc70562f1	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	2026-06-01	16:00	CANCELLED	\N	PENDING	Client rescheduled.	\N	\N	2026-06-03 13:13:56.833+02	2026-06-03 13:13:56.833+02
601b7234-6e8c-452c-97df-d8b95cd7df90	8e5cb9b0-8ebf-49e9-819b-ad470f81afbf	f88e5101-1b13-40a4-ba45-345870631ad7	d30eee4c-4313-4017-b1d2-77bdc70562f1	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	2026-06-05	10:00	COMPLETED_WITH_ISSUES	2026-06-03	NEEDS_MAINTENANCE	\N	low pressure	recharge	2026-06-03 13:15:43.337+02	2026-06-03 13:15:43.392+02
ea194035-d018-4e53-9d40-4f4a614d8b21	8e5cb9b0-8ebf-49e9-819b-ad470f81afbf	f88e5101-1b13-40a4-ba45-345870631ad7	d30eee4c-4313-4017-b1d2-77bdc70562f1	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	2026-06-23	09:00	SCHEDULED	\N	PENDING	\N	\N	\N	2026-06-03 13:15:43.518+02	2026-06-03 13:15:43.518+02
f069ebcf-45f0-486f-980a-0ad47c1be57f	6840004e-8e97-44ab-af9a-74b261fe0ccf	f88e5101-1b13-40a4-ba45-345870631ad7	d30eee4c-4313-4017-b1d2-77bdc70562f1	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	2026-06-05	10:00	COMPLETED_WITH_ISSUES	2026-06-03	NEEDS_MAINTENANCE	\N	low pressure	recharge	2026-06-03 13:16:30.707+02	2026-06-03 13:16:30.73+02
5c4aea9e-5424-4379-a001-83d5bd0e2d14	6840004e-8e97-44ab-af9a-74b261fe0ccf	f88e5101-1b13-40a4-ba45-345870631ad7	d30eee4c-4313-4017-b1d2-77bdc70562f1	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	2026-06-23	09:00	COMPLETED	2026-06-03	PASSED				2026-06-03 13:16:30.814+02	2026-06-03 13:57:35.697+02
1f0aba38-2d5a-4afc-8ba4-810b279818cf	25e2b72b-98c1-4afc-b2ad-4e611b8ff290	de53289c-30a7-4c7c-bed6-ba40f6332994	d30eee4c-4313-4017-b1d2-77bdc70562f1	21130ed6-a744-487c-b93a-53967d56f580	2026-06-03	09:00	SCHEDULED	\N	PENDING	\N	\N	\N	2026-06-03 13:55:55.193+02	2026-06-03 13:59:08.64+02
a4cf812d-6fb7-4383-9044-b9585caf344e	9b5056e5-dce1-4445-85de-eec23f53b7d7	f88e5101-1b13-40a4-ba45-345870631ad7	d30eee4c-4313-4017-b1d2-77bdc70562f1	fbeba116-b88f-4992-9829-a52d6fd6e9bf	2026-06-08	09:00	COMPLETED	2026-06-03	PASSED				2026-06-03 13:13:56.833+02	2026-06-03 14:01:17.851+02
\.


--
-- Data for Name: maintenance_logs; Type: TABLE DATA; Schema: inspection; Owner: -
--

COPY inspection.maintenance_logs (id, "extinguisherId", "inspectionId", "inspectorId", "actionTaken", "maintenanceDate", "issuesIdentified", notes, recommendations, "statusAfterMaintenance", "createdAt", "updatedAt") FROM stdin;
1a67a78a-6b43-4de9-85fc-d3bab9a86d5d	f108f9ea-1e47-40af-ae95-116c9dafee88	cbcbdae8-5b40-4d6b-b2da-33ecb7711e50	cbccb66b-f144-44ec-b144-1f427d890c07	Recharged cylinder	2026-05-15	Low pressure	Refilled to spec.	Monitor monthly.	ACTIVE	2026-06-03 13:13:56.838+02	2026-06-03 13:13:56.838+02
bda65dff-0410-43d8-99d9-4473fde90605	dd053bd6-5c98-4951-a8d8-817c2e8067a3	153f0cb5-388b-4dc3-8a9a-509ad6ae31f2	21130ed6-a744-487c-b93a-53967d56f580	Replaced nozzle	2026-05-17	Corrosion	New nozzle fitted.	Replace unit next cycle.	REPLACEMENT_REQUIRED	2026-06-03 13:13:56.838+02	2026-06-03 13:13:56.838+02
656514aa-98ab-4359-9384-25ef67e9ad5f	8e5cb9b0-8ebf-49e9-819b-ad470f81afbf	601b7234-6e8c-452c-97df-d8b95cd7df90	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	Recharged	2026-06-03	low pressure	\N	\N	ACTIVE	2026-06-03 13:15:43.449+02	2026-06-03 13:15:43.449+02
20c0eb05-3ba0-4c79-b083-a148928e921a	6840004e-8e97-44ab-af9a-74b261fe0ccf	f069ebcf-45f0-486f-980a-0ad47c1be57f	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	Recharged	2026-06-03	low pressure	\N	\N	ACTIVE	2026-06-03 13:16:30.762+02	2026-06-03 13:16:30.762+02
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: notification; Owner: -
--

COPY notification.notifications (id, "userId", type, title, message, channel, status, "isRead", metadata, "createdAt", "updatedAt") FROM stdin;
bcdb6ff6-712c-460a-a9a0-f91a8ce02dc5	f88e5101-1b13-40a4-ba45-345870631ad7	EXT_ASSIGNED	Extinguisher assigned	An extinguisher was assigned to Kigali Heights Ltd.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
86721a08-dfa1-4624-833d-e5e61e0987c6	f88e5101-1b13-40a4-ba45-345870631ad7	INSPECTION_SCHEDULED	Inspection scheduled	Your next inspection is scheduled.	IN_APP	SENT	t	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
d04188d9-7094-417b-80b3-b35442963acb	e27f696b-6c41-4344-9d5a-5f3c842207cd	EXT_ASSIGNED	Extinguisher assigned	An extinguisher was assigned to Green Hills Academy.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
39ed22cd-b5c1-480a-a7f9-608dbd923fb6	e27f696b-6c41-4344-9d5a-5f3c842207cd	INSPECTION_SCHEDULED	Inspection scheduled	Your next inspection is scheduled.	IN_APP	SENT	t	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
ad7808af-8326-4580-a0fd-25e11ebeca9e	1bf5b07c-1058-4fea-befa-802cadf35700	EXT_ASSIGNED	Extinguisher assigned	An extinguisher was assigned to Damas Pharmacy.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
1611d95a-8ffd-487e-81b4-f409081ebc77	1bf5b07c-1058-4fea-befa-802cadf35700	INSPECTION_SCHEDULED	Inspection scheduled	Your next inspection is scheduled.	IN_APP	SENT	t	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
de45c4d8-1c03-4828-b247-fc415661f9a2	2ba5156d-df2f-43ae-8e39-3194cb7229c6	EXT_ASSIGNED	Extinguisher assigned	An extinguisher was assigned to Serena Hotel Kigali.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
7c0c928d-917a-4a5e-bc2e-2b42d63c6211	2ba5156d-df2f-43ae-8e39-3194cb7229c6	INSPECTION_SCHEDULED	Inspection scheduled	Your next inspection is scheduled.	IN_APP	SENT	t	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
0217cdfe-381c-4aed-8cd8-0ff71df37d80	21130ed6-a744-487c-b93a-53967d56f580	INSPECTOR_ASSIGNED	Inspection assigned	You have a new inspection assignment.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
4681a1db-93a7-4121-be28-21fd8c85b982	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR_ASSIGNED	Inspection assigned	You have a new inspection assignment.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
cac3d129-e564-4076-b7ae-d9b0a6d720e8	cbccb66b-f144-44ec-b144-1f427d890c07	INSPECTOR_ASSIGNED	Inspection assigned	You have a new inspection assignment.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
a9a21048-fab0-454e-8293-2ac81f7a2ecb	d30eee4c-4313-4017-b1d2-77bdc70562f1	REQUEST_SUBMITTED	New request	A new extinguisher request awaits review.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
f71f2b4f-2403-4a98-9a6d-c314ddf97eac	d30eee4c-4313-4017-b1d2-77bdc70562f1	MAINTENANCE_REQUIRED	Maintenance required	An inspection flagged maintenance.	IN_APP	SENT	f	\N	2026-06-03 13:13:56.84+02	2026-06-03 13:13:56.84+02
cecb0117-690a-49ab-95e2-1c75330ff834	f88e5101-1b13-40a4-ba45-345870631ad7	REQUEST_SUBMITTED	Request submitted	Your request for 1 extinguisher(s) at Test Lobby was submitted.	IN_APP	SENT	f	\N	2026-06-03 13:14:37.678+02	2026-06-03 13:14:37.678+02
19df457d-c88a-4e6e-9f09-8494925acfc0	d30eee4c-4313-4017-b1d2-77bdc70562f1	REQUEST_SUBMITTED	New extinguisher request	company@tzw.rw requested 1 extinguisher(s) at Test Lobby.	IN_APP	SENT	f	\N	2026-06-03 13:14:37.72+02	2026-06-03 13:14:37.72+02
44d0abb1-b32e-426f-a69c-848a5078afc3	f88e5101-1b13-40a4-ba45-345870631ad7	REQUEST_REVIEWED	Request approved	Your extinguisher request was APPROVED. Note: ok	IN_APP	SENT	f	\N	2026-06-03 13:14:38.159+02	2026-06-03 13:14:38.159+02
b8cc0031-1e0c-44ab-afd4-ede1b2942a44	f88e5101-1b13-40a4-ba45-345870631ad7	EXT_ASSIGNED	Extinguisher assigned to you	Extinguisher FE-SMOKE-0001 has been assigned to you. Please install within 7 days.	IN_APP	SENT	f	\N	2026-06-03 13:14:38.815+02	2026-06-03 13:14:38.815+02
2eabaaae-5230-410a-b7ec-664a4e1da4cb	f88e5101-1b13-40a4-ba45-345870631ad7	REQUEST_SUBMITTED	Request submitted	Your request for 1 extinguisher(s) at Smoke Lobby was submitted.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.161+02	2026-06-03 13:15:43.161+02
2eb965de-908c-4888-bdb5-0a7593b5c1a0	d30eee4c-4313-4017-b1d2-77bdc70562f1	REQUEST_SUBMITTED	New extinguisher request	company@tzw.rw requested 1 extinguisher(s) at Smoke Lobby.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.209+02	2026-06-03 13:15:43.209+02
06f32c74-ff8d-4745-bac3-7ce003b11227	f88e5101-1b13-40a4-ba45-345870631ad7	REQUEST_REVIEWED	Request approved	Your extinguisher request was APPROVED. Note: ok	IN_APP	SENT	f	\N	2026-06-03 13:15:43.22+02	2026-06-03 13:15:43.22+02
93f6fded-1af5-422b-b91e-44b88e85351c	f88e5101-1b13-40a4-ba45-345870631ad7	EXT_ASSIGNED	Extinguisher assigned to you	Extinguisher FE-SMOKE-1780485343220 has been assigned to you. Please install within 7 days.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.238+02	2026-06-03 13:15:43.238+02
c2c07271-53f4-42aa-bf31-055942add338	f88e5101-1b13-40a4-ba45-345870631ad7	INSPECTION_SCHEDULED	Inspection scheduled	An inspection for FE-SMOKE-1780485343220 was scheduled for 2026-06-05.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.356+02	2026-06-03 13:15:43.356+02
de94f3cc-cc26-4820-86c6-ed3130974839	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR_ASSIGNED	Inspection assigned	You have been assigned an inspection for FE-SMOKE-1780485343220.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.362+02	2026-06-03 13:15:43.362+02
06349784-4dc2-4068-925a-c4d5bd8ea2ee	f88e5101-1b13-40a4-ba45-345870631ad7	MAINTENANCE_REQUIRED	Inspection completed	Your inspection completed with result NEEDS_MAINTENANCE.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.416+02	2026-06-03 13:15:43.416+02
dd2f5e9c-653a-42f3-b0ec-ba2d84347e92	d30eee4c-4313-4017-b1d2-77bdc70562f1	MAINTENANCE_REQUIRED	Maintenance required	Inspection 601b7234-6e8c-452c-97df-d8b95cd7df90 found issues — maintenance required.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.447+02	2026-06-03 13:15:43.447+02
8a7086ba-7f3c-422d-8116-1e8ba84e2fa4	21130ed6-a744-487c-b93a-53967d56f580	MAINTENANCE_REQUIRED	Maintenance required	Inspection 601b7234-6e8c-452c-97df-d8b95cd7df90 found issues — maintenance required.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.451+02	2026-06-03 13:15:43.451+02
a4a09ed0-2902-4e9d-bf12-d51e3f7c7ccd	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	MAINTENANCE_REQUIRED	Maintenance required	Inspection 601b7234-6e8c-452c-97df-d8b95cd7df90 found issues — maintenance required.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.457+02	2026-06-03 13:15:43.457+02
65bd54d7-0fd1-45b1-b6a7-a1ee8192afb9	cbccb66b-f144-44ec-b144-1f427d890c07	MAINTENANCE_REQUIRED	Maintenance required	Inspection 601b7234-6e8c-452c-97df-d8b95cd7df90 found issues — maintenance required.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.464+02	2026-06-03 13:15:43.464+02
24aa8f72-0e08-4dac-9906-fbc25feb26b6	f88e5101-1b13-40a4-ba45-345870631ad7	INSPECTION_SCHEDULED	Inspection scheduled	An inspection for FE-SMOKE-1780485343220 was scheduled for 2026-06-23.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.521+02	2026-06-03 13:15:43.521+02
fe3211c4-01c9-4e82-bf3b-74f3211033e0	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR_ASSIGNED	Inspection assigned	You have been assigned an inspection for FE-SMOKE-1780485343220.	IN_APP	SENT	f	\N	2026-06-03 13:15:43.522+02	2026-06-03 13:15:43.522+02
9866f7c2-6f57-4530-b31a-76e8a6c28b17	f88e5101-1b13-40a4-ba45-345870631ad7	REQUEST_SUBMITTED	Request submitted	Your request for 1 extinguisher(s) at Smoke Lobby was submitted.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.564+02	2026-06-03 13:16:30.564+02
4cb20e28-b4a1-4459-af31-e05ce2420d67	d30eee4c-4313-4017-b1d2-77bdc70562f1	REQUEST_SUBMITTED	New extinguisher request	company@tzw.rw requested 1 extinguisher(s) at Smoke Lobby.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.612+02	2026-06-03 13:16:30.612+02
bd086ad9-2977-465d-82d0-84a1fd8e12ff	f88e5101-1b13-40a4-ba45-345870631ad7	REQUEST_REVIEWED	Request approved	Your extinguisher request was APPROVED. Note: ok	IN_APP	SENT	f	\N	2026-06-03 13:16:30.626+02	2026-06-03 13:16:30.626+02
71594aa0-7f32-492a-8d89-e03d854b24ba	f88e5101-1b13-40a4-ba45-345870631ad7	EXT_ASSIGNED	Extinguisher assigned to you	Extinguisher FE-SMOKE-1780485390626 has been assigned to you. Please install within 7 days.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.645+02	2026-06-03 13:16:30.645+02
8a89147f-0b46-4797-a6a1-9798ce4c0322	f88e5101-1b13-40a4-ba45-345870631ad7	INSPECTION_SCHEDULED	Inspection scheduled	An inspection for FE-SMOKE-1780485390626 was scheduled for 2026-06-05.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.711+02	2026-06-03 13:16:30.711+02
a68746a9-4450-474a-9709-ea5c79442e75	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR_ASSIGNED	Inspection assigned	You have been assigned an inspection for FE-SMOKE-1780485390626.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.712+02	2026-06-03 13:16:30.712+02
9dcea27d-54a8-4761-8eb2-b2ed990c3c6e	f88e5101-1b13-40a4-ba45-345870631ad7	MAINTENANCE_REQUIRED	Inspection completed	Your inspection completed with result NEEDS_MAINTENANCE.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.742+02	2026-06-03 13:16:30.742+02
9d73a657-955a-4a91-bb3a-0b6547ca94e4	d30eee4c-4313-4017-b1d2-77bdc70562f1	MAINTENANCE_REQUIRED	Maintenance required	Inspection f069ebcf-45f0-486f-980a-0ad47c1be57f found issues — maintenance required.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.761+02	2026-06-03 13:16:30.761+02
2c97b466-bd19-4b69-8fd0-03cb01814bd5	21130ed6-a744-487c-b93a-53967d56f580	MAINTENANCE_REQUIRED	Maintenance required	Inspection f069ebcf-45f0-486f-980a-0ad47c1be57f found issues — maintenance required.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.762+02	2026-06-03 13:16:30.762+02
1b43fcbe-9129-4025-ac77-3995a27b3288	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	MAINTENANCE_REQUIRED	Maintenance required	Inspection f069ebcf-45f0-486f-980a-0ad47c1be57f found issues — maintenance required.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.771+02	2026-06-03 13:16:30.771+02
56e8b96b-4b8c-4270-a362-88067823d4fc	cbccb66b-f144-44ec-b144-1f427d890c07	MAINTENANCE_REQUIRED	Maintenance required	Inspection f069ebcf-45f0-486f-980a-0ad47c1be57f found issues — maintenance required.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.774+02	2026-06-03 13:16:30.774+02
7883dc5b-6627-4b6e-bcf1-4023b08ffbc2	f88e5101-1b13-40a4-ba45-345870631ad7	INSPECTION_SCHEDULED	Inspection scheduled	An inspection for FE-SMOKE-1780485390626 was scheduled for 2026-06-23.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.821+02	2026-06-03 13:16:30.821+02
341965af-339b-4fc5-be70-3aa5b1c5b7f9	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTOR_ASSIGNED	Inspection assigned	You have been assigned an inspection for FE-SMOKE-1780485390626.	IN_APP	SENT	f	\N	2026-06-03 13:16:30.822+02	2026-06-03 13:16:30.822+02
4f7a78c1-fb4a-4414-a7d7-cf16216d1551	f88e5101-1b13-40a4-ba45-345870631ad7	REQUEST_REVIEWED	Request approved	Your extinguisher request was APPROVED.	IN_APP	SENT	f	\N	2026-06-03 13:28:19.813+02	2026-06-03 13:28:19.813+02
fc63f377-2f7c-4eb2-b148-9ebc39d26b59	e27f696b-6c41-4344-9d5a-5f3c842207cd	REQUEST_REVIEWED	Request approved	Your extinguisher request was APPROVED.	IN_APP	SENT	f	\N	2026-06-03 13:28:45.325+02	2026-06-03 13:28:45.325+02
64b38b9d-50f6-4544-9e52-72b0d2fb6779	de53289c-30a7-4c7c-bed6-ba40f6332994	REQUEST_SUBMITTED	Request submitted	Your request for 7 extinguisher(s) at Gasabo apacope was submitted.	IN_APP	SENT	f	\N	2026-06-03 13:44:39.805+02	2026-06-03 13:44:39.805+02
ff1f1080-cec1-4a1e-9a50-1738d9fb548f	d30eee4c-4313-4017-b1d2-77bdc70562f1	REQUEST_SUBMITTED	New extinguisher request	snakail340@gmail.com requested 7 extinguisher(s) at Gasabo apacope.	IN_APP	SENT	f	\N	2026-06-03 13:44:39.903+02	2026-06-03 13:44:39.903+02
6a9ccfe6-1dc9-430c-a5f3-ae37624b0096	de53289c-30a7-4c7c-bed6-ba40f6332994	REQUEST_REVIEWED	Request approved	Your extinguisher request was APPROVED.	IN_APP	SENT	f	\N	2026-06-03 13:46:50.404+02	2026-06-03 13:46:50.404+02
c662df51-dc1f-4541-b457-d97843d57545	de53289c-30a7-4c7c-bed6-ba40f6332994	EXT_ASSIGNED	Extinguisher assigned to you	Extinguisher FE-2026-KGL-0003 has been assigned to you. Please install within 7 days.	IN_APP	SENT	f	\N	2026-06-03 13:47:12.483+02	2026-06-03 13:47:12.483+02
238bdbdb-9b0a-45f8-92f5-387d3416c695	de53289c-30a7-4c7c-bed6-ba40f6332994	EXT_ASSIGNED	Extinguisher assigned to you	Extinguisher FE-2026-KGL-0001 has been assigned to you. Please install within 7 days.	IN_APP	SENT	f	\N	2026-06-03 13:55:24.491+02	2026-06-03 13:55:24.491+02
dc75b9a5-d66a-449c-bf48-e6b33d5b1c55	de53289c-30a7-4c7c-bed6-ba40f6332994	EXT_ASSIGNED	Extinguisher assigned to you	Extinguisher FE-2026-KGL-0002 has been assigned to you. Please install within 7 days.	IN_APP	SENT	f	\N	2026-06-03 13:55:27.751+02	2026-06-03 13:55:27.751+02
d9f73322-61d6-4a33-b88a-fd73aed121b4	de53289c-30a7-4c7c-bed6-ba40f6332994	INSPECTION_REQUESTED	Inspection requested	Your inspection request for FE-2026-KGL-0003 was submitted.	IN_APP	SENT	f	\N	2026-06-03 13:55:55.208+02	2026-06-03 13:55:55.208+02
7a7bd3d4-c5a3-473b-9b9e-14db50e642c9	21130ed6-a744-487c-b93a-53967d56f580	INSPECTION_REQUESTED	New inspection request	Inspection requested for FE-2026-KGL-0003 on 2026-06-03.	IN_APP	SENT	f	\N	2026-06-03 13:55:55.299+02	2026-06-03 13:55:55.299+02
0554ea6b-50dd-4146-81a0-7f5e3bc2eee3	d30eee4c-4313-4017-b1d2-77bdc70562f1	INSPECTION_REQUESTED	New inspection request	Inspection requested for FE-2026-KGL-0003 on 2026-06-03.	IN_APP	SENT	f	\N	2026-06-03 13:55:55.298+02	2026-06-03 13:55:55.298+02
e9a1cffc-4364-462c-8384-3533e0a36d74	4652fe2d-d6df-4c71-9cc9-b4a9ff73b035	INSPECTION_REQUESTED	New inspection request	Inspection requested for FE-2026-KGL-0003 on 2026-06-03.	IN_APP	SENT	f	\N	2026-06-03 13:55:55.3+02	2026-06-03 13:55:55.3+02
61d8efd1-0036-4621-a881-32bb8873729d	cbccb66b-f144-44ec-b144-1f427d890c07	INSPECTION_REQUESTED	New inspection request	Inspection requested for FE-2026-KGL-0003 on 2026-06-03.	IN_APP	SENT	f	\N	2026-06-03 13:55:55.301+02	2026-06-03 13:55:55.301+02
17f5ce42-d69a-45ba-b1de-8ddcec09579a	f88e5101-1b13-40a4-ba45-345870631ad7	INSPECTION_SCHEDULED	Inspection completed	Your inspection completed with result PASSED.	IN_APP	SENT	f	\N	2026-06-03 13:57:35.712+02	2026-06-03 13:57:35.712+02
1b8b356c-8efa-408a-a980-d7304b25a914	21130ed6-a744-487c-b93a-53967d56f580	INSPECTOR_ASSIGNED	Inspection assigned	You have been assigned inspection 1f0aba38-2d5a-4afc-8ba4-810b279818cf.	IN_APP	SENT	f	\N	2026-06-03 13:59:08.652+02	2026-06-03 13:59:08.652+02
e25e9123-4254-4b8a-a4ca-ad0ff1ee7372	de53289c-30a7-4c7c-bed6-ba40f6332994	INSPECTION_SCHEDULED	Inspection scheduled	An inspector has been assigned to your inspection.	IN_APP	SENT	f	\N	2026-06-03 13:59:08.654+02	2026-06-03 13:59:08.654+02
52cddb89-5635-42a7-954f-59d4658cbc5b	fbeba116-b88f-4992-9829-a52d6fd6e9bf	INSPECTOR_ASSIGNED	Inspection assigned	You have been assigned inspection a4cf812d-6fb7-4383-9044-b9585caf344e.	IN_APP	SENT	f	\N	2026-06-03 14:00:59.078+02	2026-06-03 14:00:59.078+02
80945125-fb8e-4126-98b6-943316b780ea	f88e5101-1b13-40a4-ba45-345870631ad7	INSPECTION_SCHEDULED	Inspection scheduled	An inspector has been assigned to your inspection.	IN_APP	SENT	f	\N	2026-06-03 14:00:59.082+02	2026-06-03 14:00:59.082+02
2a1f8b3d-b4ff-45f3-9afc-8346e1284e4b	f88e5101-1b13-40a4-ba45-345870631ad7	INSPECTION_SCHEDULED	Inspection completed	Your inspection completed with result PASSED.	IN_APP	SENT	f	\N	2026-06-03 14:01:17.87+02	2026-06-03 14:01:17.87+02
7baf39c6-ddbd-4727-a81b-7c5ff5d116d8	24c76e5b-4c6d-4aa0-87d5-960fb566e735	EXT_ASSIGNED	Extinguisher assigned to you	Extinguisher FE-2026-KGL-009 has been assigned to you. Please install within 7 days.	IN_APP	SENT	f	\N	2026-06-04 11:00:17.088+02	2026-06-04 11:00:17.088+02
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- Name: users users_email_key10; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key10 UNIQUE (email);


--
-- Name: users users_email_key11; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key11 UNIQUE (email);


--
-- Name: users users_email_key12; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key12 UNIQUE (email);


--
-- Name: users users_email_key13; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key13 UNIQUE (email);


--
-- Name: users users_email_key14; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key14 UNIQUE (email);


--
-- Name: users users_email_key15; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key15 UNIQUE (email);


--
-- Name: users users_email_key16; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key16 UNIQUE (email);


--
-- Name: users users_email_key17; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key17 UNIQUE (email);


--
-- Name: users users_email_key18; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key18 UNIQUE (email);


--
-- Name: users users_email_key2; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key2 UNIQUE (email);


--
-- Name: users users_email_key3; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key3 UNIQUE (email);


--
-- Name: users users_email_key4; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key4 UNIQUE (email);


--
-- Name: users users_email_key5; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key5 UNIQUE (email);


--
-- Name: users users_email_key6; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key6 UNIQUE (email);


--
-- Name: users users_email_key7; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key7 UNIQUE (email);


--
-- Name: users users_email_key8; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key8 UNIQUE (email);


--
-- Name: users users_email_key9; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key9 UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: extinguisher_requests extinguisher_requests_pkey; Type: CONSTRAINT; Schema: extinguisher; Owner: -
--

ALTER TABLE ONLY extinguisher.extinguisher_requests
    ADD CONSTRAINT extinguisher_requests_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_pkey; Type: CONSTRAINT; Schema: extinguisher; Owner: -
--

ALTER TABLE ONLY extinguisher.extinguishers
    ADD CONSTRAINT extinguishers_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_serialNumber_key; Type: CONSTRAINT; Schema: extinguisher; Owner: -
--

ALTER TABLE ONLY extinguisher.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key" UNIQUE ("serialNumber");


--
-- Name: extinguishers extinguishers_serialNumber_key1; Type: CONSTRAINT; Schema: extinguisher; Owner: -
--

ALTER TABLE ONLY extinguisher.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key1" UNIQUE ("serialNumber");


--
-- Name: extinguishers extinguishers_serialNumber_key2; Type: CONSTRAINT; Schema: extinguisher; Owner: -
--

ALTER TABLE ONLY extinguisher.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key2" UNIQUE ("serialNumber");


--
-- Name: extinguishers extinguishers_serialNumber_key3; Type: CONSTRAINT; Schema: extinguisher; Owner: -
--

ALTER TABLE ONLY extinguisher.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key3" UNIQUE ("serialNumber");


--
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: inspection; Owner: -
--

ALTER TABLE ONLY inspection.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- Name: maintenance_logs maintenance_logs_pkey; Type: CONSTRAINT; Schema: inspection; Owner: -
--

ALTER TABLE ONLY inspection.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: notification; Owner: -
--

ALTER TABLE ONLY notification.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_action; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_action ON auth.audit_logs USING btree (action);


--
-- Name: audit_logs_actor_id; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_actor_id ON auth.audit_logs USING btree ("actorId");


--
-- Name: audit_logs_target_type; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_target_type ON auth.audit_logs USING btree ("targetType");


--
-- Name: refresh_tokens_user_id; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_user_id ON auth.refresh_tokens USING btree ("userId");


--
-- Name: users_email; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email ON auth.users USING btree (email);


--
-- Name: extinguisher_requests_status; Type: INDEX; Schema: extinguisher; Owner: -
--

CREATE INDEX extinguisher_requests_status ON extinguisher.extinguisher_requests USING btree (status);


--
-- Name: extinguisher_requests_user_id; Type: INDEX; Schema: extinguisher; Owner: -
--

CREATE INDEX extinguisher_requests_user_id ON extinguisher.extinguisher_requests USING btree ("userId");


--
-- Name: extinguishers_expiry_date; Type: INDEX; Schema: extinguisher; Owner: -
--

CREATE INDEX extinguishers_expiry_date ON extinguisher.extinguishers USING btree ("expiryDate");


--
-- Name: extinguishers_serial_number; Type: INDEX; Schema: extinguisher; Owner: -
--

CREATE UNIQUE INDEX extinguishers_serial_number ON extinguisher.extinguishers USING btree ("serialNumber");


--
-- Name: extinguishers_status; Type: INDEX; Schema: extinguisher; Owner: -
--

CREATE INDEX extinguishers_status ON extinguisher.extinguishers USING btree (status);


--
-- Name: extinguishers_user_id; Type: INDEX; Schema: extinguisher; Owner: -
--

CREATE INDEX extinguishers_user_id ON extinguisher.extinguishers USING btree ("userId");


--
-- Name: inspections_extinguisher_id; Type: INDEX; Schema: inspection; Owner: -
--

CREATE INDEX inspections_extinguisher_id ON inspection.inspections USING btree ("extinguisherId");


--
-- Name: inspections_inspector_id; Type: INDEX; Schema: inspection; Owner: -
--

CREATE INDEX inspections_inspector_id ON inspection.inspections USING btree ("inspectorId");


--
-- Name: inspections_requested_by_user_id; Type: INDEX; Schema: inspection; Owner: -
--

CREATE INDEX inspections_requested_by_user_id ON inspection.inspections USING btree ("requestedByUserId");


--
-- Name: inspections_scheduled_date; Type: INDEX; Schema: inspection; Owner: -
--

CREATE INDEX inspections_scheduled_date ON inspection.inspections USING btree ("scheduledDate");


--
-- Name: inspections_status; Type: INDEX; Schema: inspection; Owner: -
--

CREATE INDEX inspections_status ON inspection.inspections USING btree (status);


--
-- Name: maintenance_logs_extinguisher_id; Type: INDEX; Schema: inspection; Owner: -
--

CREATE INDEX maintenance_logs_extinguisher_id ON inspection.maintenance_logs USING btree ("extinguisherId");


--
-- Name: notifications_is_read; Type: INDEX; Schema: notification; Owner: -
--

CREATE INDEX notifications_is_read ON notification.notifications USING btree ("isRead");


--
-- Name: notifications_type; Type: INDEX; Schema: notification; Owner: -
--

CREATE INDEX notifications_type ON notification.notifications USING btree (type);


--
-- Name: notifications_user_id; Type: INDEX; Schema: notification; Owner: -
--

CREATE INDEX notifications_user_id ON notification.notifications USING btree ("userId");


--
-- PostgreSQL database dump complete
--

\unrestrict 2Z8EmBLtI6lqINaCLe3qumqDmlVYXzh2FPKztSbetan78n8UrzezF6cJj2PGwpH

