import psycopg2

# ✅ Connect to your PostgreSQL database
conn = psycopg2.connect(
    dbname="dunderdata", 
    user="postgres", 
    password="Alaska2013!", 
    host="127.0.0.1", 
    port="5432"
)
cursor = conn.cursor()

# ✅ Query all tables
cursor.execute("""
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public';
""")
tables = {row[0]: [] for row in cursor.fetchall()}  # Store table names

# ✅ Query for column details
cursor.execute("""
    SELECT c.table_name, c.column_name, c.data_type, c.column_default, 
            tc.constraint_type
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage k 
        ON c.table_name = k.table_name AND c.column_name = k.column_name
    LEFT JOIN information_schema.table_constraints tc 
        ON k.constraint_name = tc.constraint_name AND tc.constraint_type = 'PRIMARY KEY'
    WHERE c.table_schema = 'public';
""")

for row in cursor.fetchall():
    table_name, column_name, data_type, column_default, constraint_type = row

    # 🔹 Convert PostgreSQL data types to dbdiagram.io-friendly types
    if data_type == "character varying":
        data_type = "varchar"
    elif data_type == "timestamp without time zone":
        data_type = "timestamp"

    # 🔹 Mark primary key
    is_primary_key = " [pk]" if constraint_type == "PRIMARY KEY" else ""

    tables[table_name].append(f"  {column_name} {data_type}{is_primary_key}")

# ✅ Query for foreign key relationships
cursor.execute("""
    SELECT 
        conrelid::regclass AS table_name,
        a.attname AS column_name,
        confrelid::regclass AS foreign_table,
        af.attname AS foreign_column
    FROM 
        pg_attribute a
    JOIN 
        pg_constraint c ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    JOIN 
        pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
    WHERE 
        c.contype = 'f' 
        AND NOT a.attisdropped;
""")

relationships = []
for row in cursor.fetchall():
    table_name, column_name, foreign_table, foreign_column = row
    relationships.append(f"Ref: {table_name}.{column_name} > {foreign_table}.{foreign_column}")

# ✅ Generate dbdiagram.io schema
output = ""

# ✅ Generate tables
for table, columns in tables.items():
    output += f"Table {table} {{\n"
    output += "\n".join(columns) + "\n}\n\n"

# ✅ Append relationships
output += "\n".join(relationships)

# ✅ Save to file
with open("dbdiagram_schema.txt", "w") as f:
    f.write(output)

print("✅ Schema exported to dbdiagram_schema.txt")
