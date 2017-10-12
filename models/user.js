module.exports = (sequelize, DataTypes) => {
    const user = sequelize.define('User', {
        id: {
            field: 'id',
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        pw: {
            field: 'pw',
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            field: 'name',
            type: DataTypes.TEXT,
            allowNull: false
        },
        email: {
            field: 'email',
            type: DataTypes.TEXT,
            allowNull: false
        },
        joinDate: {
            field: 'join_date',
            type: DataTypes.DATE,
            allowNull: false
        },
        isAdmin: {
            field: 'is_admin',
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isDenied: {
            field: 'is_denied',
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
            underscored: true,
            freezeTableName: true,
            tableName: 'user',
            timestamps: false
        });
    return user;
};