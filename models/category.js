module.exports = (sequelize, DataTypes) => {
    const category = sequelize.define('Category', {
        category: {
            field: 'category',
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        userId: {
            field: 'user_id',
            type: DataTypes.STRING,
            allowNull: false
        },
        creationDate: {
            field: 'creation_date',
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
            underscored: true,
            freezeTableName: true,
            tableName: 'category',
            timestamps: false
        });
    return category;
};